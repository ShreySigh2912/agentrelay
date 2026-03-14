#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Linking CLI globally..."
npm link

echo "Installation complete! You can now use 'agentrelay' in your terminal."
