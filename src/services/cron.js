import cron from 'node-cron';
import chalk from 'chalk';
import Config from '../config/index.js';
import agentBridge from '../agent/bridge.js';

class CronService {
  constructor() {
    this.jobs = new Map(); // agentId:jobId -> cronJob instance
    this.configManager = new Config();
  }

  /**
   * Initialize all cron jobs from the current configuration
   */
  async start() {
    const config = this.configManager.load();
    console.log(chalk.cyan('[CronService] Initializing scheduled jobs...'));

    for (const agent of config.agents || []) {
      if (agent.cronJobs) {
        for (const [index, job] of agent.cronJobs.entries()) {
          this.schedule(agent.id, index, job);
        }
      }
    }
  }

  /**
   * Schedule a single cron job
   * @param {string} agentId 
   * @param {number} jobIndex 
   * @param {Object} jobDef - { schedule, prompt, channel, recipient }
   */
  schedule(agentId, jobIndex, jobDef) {
    const jobId = `${agentId}:${jobIndex}`;
    
    // Stop existing if any
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).stop();
    }

    try {
      const task = cron.schedule(jobDef.schedule, async () => {
        console.log(chalk.magenta(`[Cron] Triggering job for agent ${agentId}: "${jobDef.prompt}"`));
        
        try {
          // Find the agent config for bridge context (though bridge usually re-loads)
          const result = await agentBridge.send({
            sessionId: `cron_${jobId}`,
            text: jobDef.prompt,
            channel: jobDef.channel || 'internal',
            senderId: 'scheduler'
          });

          console.log(chalk.magenta(`[Cron] Agent ${agentId} responded: ${result.substring(0, 50)}...`));
          
          // Optionally send to a specific channel recipient if configured
          // This would require injecting the gatewayController or having a generic "notify" method
          // For now, we log the result. In a full implementation, we'd fire a channel-specific send.
        } catch (err) {
          console.error(chalk.red(`[Cron Error] Agent execution failed: ${err.message}`));
        }
      });

      this.jobs.set(jobId, task);
      console.log(chalk.green(`[Cron] Scheduled: [${agentId}] ${jobDef.schedule} -> "${jobDef.prompt}"`));
    } catch (err) {
      console.error(chalk.red(`[Cron Error] Invalid schedule for ${jobId}: ${err.message}`));
    }
  }

  stopAll() {
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
  }
}

const cronService = new CronService();
export default cronService;
