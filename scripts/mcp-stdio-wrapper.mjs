#!/usr/bin/env node
/**
 * Stdio-to-HTTP wrapper for MCP clients that don't support HTTP transport
 * Usage: node mcp-stdio-wrapper.mjs
 * 
 * Set environment variables:
 *   MCP_URL=http://localhost:3001/mcp
 *   MCP_TOKEN=emingench@gmail.com
 */

import { createInterface } from 'readline';

const MCP_URL = process.env.MCP_URL || 'http://localhost:3001/mcp';
const MCP_TOKEN = process.env.MCP_TOKEN || '';

const rl = createInterface({ input: process.stdin });

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MCP_TOKEN}`,
      },
      body: JSON.stringify(request),
    });

    if (response.status === 202) {
      // Notification accepted, no response needed
      return;
    }

    const result = await response.json();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message },
      id: null,
    }));
  }
});
