# Mentra Glass MCP Server

A Model Context Protocol (MCP) server for controlling MentraOS smart glasses.
Built with **Bun**, **Mentra SDK**, and **MCP SDK**.

## Features

- **MCP Support**: Exposes tools to control glasses (Display, Audio, Input) via JSON-RPC.
- **Multi-User**: Supports multiple users via Bearer token authentication (email).
- **Mentra Integration**: Connects to Mentra Cloud as an AppServer.
- **Docker Ready**: Includes Dockerfile and Compose setup.

## Architecture

```
MCP Client (Claude/Cursor) 
       ⬇️ JSON-RPC (HTTP)
   [MCP Server]
       ⬇️ Mentra SDK
   Mentra Cloud
       ⬇️
   Smart Glasses
```

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- Mentra Developer Account & API Key

## Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd mcp-for-next.js
   bun install
   ```

2. **Environment Variables**
   Create a `.env` file (or set env vars):
   ```bash
   PACKAGE_NAME="com.yourname.glass-mcp"
   MENTRAOS_API_KEY="your-mentra-api-key"
   PORT=3000
   MENTRA_INTERNAL_PORT=3099
   # Optional: Map tokens to emails
   MCP_USER_TOKENS='{"my-secret-token": "user@example.com"}'
   # Optional: Admin token
   MCP_ADMIN_TOKEN="admin-secret"
   ```

## Running Locally

```bash
# Start the server
bun run src/index.ts

# Watch mode
bun run dev
```

The server will start on `http://localhost:3000`.
- `/mcp`: MCP JSON-RPC endpoint
- `/health`: Health check

## Running with Docker

```bash
# Build
bun run docker:build

# Run
bun run docker:up
```

## Usage with Claude Desktop / Cursor

Configure your MCP client to point to this server.

**HTTP Config:**
- URL: `http://localhost:3000/mcp`
- Headers: `Authorization: Bearer user@example.com`

**Stdio Config (via wrapper):**
```json
{
  "mcpServers": {
    "mentra-glass": {
      "command": "node",
      "args": ["path/to/scripts/mcp-stdio-wrapper.mjs"],
      "env": {
        "MCP_URL": "http://localhost:3000/mcp",
        "MCP_TOKEN": "user@example.com"
      }
    }
  }
}
```

## Available Tools

- **Display**: `glasses_display_text`, `glasses_clear_display`
- **Audio**: `glasses_speak`
- **Input**: `glasses_get_transcriptions`, `glasses_get_events`
- **System**: `glasses_status`

## Project Structure

- `src/config`: Environment configuration
- `src/services`: Core logic (Mentra SDK, Session Management)
- `src/tools`: MCP Tool definitions
- `src/index.ts`: Entry point
