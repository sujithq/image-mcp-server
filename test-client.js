#!/usr/bin/env node

/**
 * Simple test client for the Azure Image MCP Server
 *
 * This script demonstrates how to connect to the server and generate an image.
 * For actual use, integrate this server with an MCP-compatible client like Claude Desktop.
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testServer() {
  console.log('Starting Azure Image MCP Server test...\n');

  // Start the server
  const serverPath = join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env
  });

  // Initialize MCP connection
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initMessage) + '\n');

  // List tools
  const listToolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  setTimeout(() => {
    server.stdin.write(JSON.stringify(listToolsMessage) + '\n');
  }, 1000);

  // Generate an image
  const generateImageMessage = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: 'A serene mountain landscape at sunset with a crystal clear lake in the foreground',
        size: '1024x1024',
        quality: 'standard'
      }
    }
  };

  setTimeout(() => {
    console.log('Requesting image generation...\n');
    server.stdin.write(JSON.stringify(generateImageMessage) + '\n');
  }, 2000);

  // Handle server output
  let buffer = '';
  server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log('Server response:', JSON.stringify(response, null, 2));

          // Exit after receiving image generation response
          if (response.id === 3) {
            console.log('\nTest completed successfully!');
            setTimeout(() => {
              server.kill();
              process.exit(0);
            }, 1000);
          }
        } catch (e) {
          // Ignore parse errors for partial JSON
        }
      }
    }
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
  });
}

// Run the test
testServer().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
