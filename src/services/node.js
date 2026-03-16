import crypto from 'crypto';
import chalk from 'chalk';
import { EventEmitter } from 'events';

/**
 * NodeGateway — WebSocket-based RPC server for companion mobile apps.
 * 
 * Flow:
 * 1. Gateway generates a pairing code via `generatePairingCode()`.
 * 2. Mobile app connects to the `/nodes` WebSocket namespace and sends `node:pair` with the code.
 * 3. Once paired, the agent can invoke remote tools (take_photo, get_location, etc.) via `invokeOnNode()`.
 * 4. The gateway sends the RPC request to the paired node and waits for a response.
 */
class NodeGateway extends EventEmitter {
  constructor() {
    super();
    this.pairedNodes = new Map();    // nodeId -> { socket, deviceName, capabilities, pairedAt }
    this.pendingPairCodes = new Map(); // code -> { createdAt, expiresAt }
    this.pendingRpcCalls = new Map(); // callId -> { resolve, reject, timeout }
  }

  /**
   * Attach to an existing Socket.IO server instance.
   * Called from gateway.js after the HTTP server is created.
   */
  attach(io) {
    this.io = io;
    const nodeNamespace = io.of('/nodes');

    nodeNamespace.on('connection', (socket) => {
      console.log(chalk.cyan(`[NodeGateway] New device connection: ${socket.id}`));

      // --- Pairing ---
      socket.on('node:pair', ({ code, deviceName, capabilities }) => {
        if (!this.pendingPairCodes.has(code)) {
          socket.emit('node:pair:error', { message: 'Invalid or expired pairing code.' });
          return;
        }

        const codeData = this.pendingPairCodes.get(code);
        if (Date.now() > codeData.expiresAt) {
          this.pendingPairCodes.delete(code);
          socket.emit('node:pair:error', { message: 'Pairing code expired.' });
          return;
        }

        // Pair successfully
        const nodeId = `node_${crypto.randomUUID().slice(0, 8)}`;
        this.pairedNodes.set(nodeId, {
          socket,
          socketId: socket.id,
          deviceName: deviceName || 'Unknown Device',
          capabilities: capabilities || [],
          pairedAt: new Date().toISOString()
        });
        this.pendingPairCodes.delete(code);

        socket.emit('node:pair:success', { nodeId, message: `Paired as "${deviceName}"` });
        console.log(chalk.green(`[NodeGateway] ✅ Device paired: ${deviceName} (${nodeId})`));
        this.emit('node:paired', { nodeId, deviceName });

        // Handle RPC responses from the node
        socket.on('node:rpc:response', ({ callId, result, error }) => {
          const pending = this.pendingRpcCalls.get(callId);
          if (!pending) return;

          clearTimeout(pending.timeout);
          this.pendingRpcCalls.delete(callId);

          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(result);
          }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log(chalk.yellow(`[NodeGateway] Device disconnected: ${deviceName} (${nodeId})`));
          this.pairedNodes.delete(nodeId);
          this.emit('node:disconnected', { nodeId });
        });
      });
    });

    console.log(chalk.cyan('[NodeGateway] WebSocket namespace /nodes ready.'));
  }

  /**
   * Generate a 6-digit pairing code valid for 5 minutes.
   */
  generatePairingCode() {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.pendingPairCodes.set(code, {
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    return code;
  }

  /**
   * List all currently paired nodes.
   */
  listNodes() {
    const nodes = [];
    for (const [nodeId, data] of this.pairedNodes.entries()) {
      nodes.push({
        nodeId,
        deviceName: data.deviceName,
        capabilities: data.capabilities,
        pairedAt: data.pairedAt,
        connected: data.socket.connected
      });
    }
    return nodes;
  }

  /**
   * Send an RPC call to a paired node and wait for a response.
   * @param {string} nodeId - The ID of the target node.
   * @param {string} method - The RPC method name (e.g., 'take_photo', 'get_location').
   * @param {object} params - Parameters for the RPC call.
   * @param {number} timeoutMs - Timeout in milliseconds (default 30s).
   * @returns {Promise<any>} The result from the node.
   */
  async invokeOnNode(nodeId, method, params = {}, timeoutMs = 30000) {
    const node = this.pairedNodes.get(nodeId);
    if (!node) {
      throw new Error(`Node "${nodeId}" is not paired or connected.`);
    }
    if (!node.socket.connected) {
      this.pairedNodes.delete(nodeId);
      throw new Error(`Node "${nodeId}" is no longer connected.`);
    }

    const callId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRpcCalls.delete(callId);
        reject(new Error(`RPC call "${method}" to node "${nodeId}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingRpcCalls.set(callId, { resolve, reject, timeout });

      node.socket.emit('node:rpc:request', { callId, method, params });
      console.log(chalk.blue(`[NodeGateway] RPC -> ${node.deviceName}: ${method}`));
    });
  }

  /**
   * Invoke an RPC on the first available paired node.
   */
  async invokeOnAnyNode(method, params = {}, timeoutMs = 30000) {
    const nodes = this.listNodes().filter(n => n.connected);
    if (nodes.length === 0) {
      throw new Error('No paired nodes are currently connected.');
    }
    return this.invokeOnNode(nodes[0].nodeId, method, params, timeoutMs);
  }
}

const nodeGateway = new NodeGateway();
export default nodeGateway;
