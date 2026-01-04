import { config } from "./config/env";
import { MentraService } from "./services/MentraService";
import { sessionManager } from "./services/SessionManager";
import { ALL_TOOLS, executeTool } from "./tools";

// --- User Token Management ---
function getUserFromToken(token: string): string | null {
  // Check direct token → email mapping
  if (config.userTokens[token]) return config.userTokens[token];
  // Allow email as token directly
  if (token.includes("@")) return token;
  // Admin token sees all (for debugging)
  if (config.adminToken && token === config.adminToken) return "*";
  return null;
}

// --- MCP Sessions ---
interface MCPSession {
  userEmail: string;
  lastSeen: number;
}
const mcpSessions = new Map<string, MCPSession>();

function generateSessionId(): string {
  return `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// --- JSON-RPC Handler (User-Scoped) ---
async function processJsonRpc(body: any, userEmail: string): Promise<any> {
  const { method, params, id } = body;

  // Initialize
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "mentra-glass-mcp", version: "1.0.0" },
      },
    };
  }

  // Notifications (no response needed)
  if (method === "notifications/initialized") {
    return null; // No response for notifications
  }

  // List tools
  if (method === "tools/list") {
    return { 
      jsonrpc: "2.0", 
      id, 
      result: { 
        tools: ALL_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        })) 
      } 
    };
  }

  // Call tool (with user context)
  if (method === "tools/call") {
    const result = await executeTool(params.name, params.arguments || {}, userEmail);
    return { jsonrpc: "2.0", id, result };
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

// --- SSE Helpers ---
function createSSEResponse(data: any, sessionId: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      const msg = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(new TextEncoder().encode(msg));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Mcp-Session-Id": sessionId,
    },
  });
}

function createSSEStream(req: Request): Response {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(": ping\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// --- Bun HTTP Server ---
async function handleMCPRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check (no auth)
  if (url.pathname === "/health") {
    return Response.json({ 
      ok: true, 
      connectedGlasses: sessionManager.getConnectedCount(), 
      activeMcpSessions: mcpSessions.size 
    });
  }

  // MCP endpoint
  if (url.pathname === "/mcp") {
    // Extract and validate Bearer token
    let auth = req.headers.get("Authorization");
    let token: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      token = auth.slice(7);
    } else {
      // Fallback: Check query parameter
      const urlToken = url.searchParams.get("token");
      if (urlToken) {
        token = urlToken;
        console.log(`[Auth] Found token in query param`);
      }
    }

    console.log(`[Auth] Header: ${auth}`);
    
    if (!token) {
      console.log("[Auth] Missing or invalid header/param");
      return Response.json(
        { error: "Missing Authorization header or token param." },
        { status: 401 }
      );
    }

    console.log(`[Auth] Token: ${token}`);
    const userEmail = getUserFromToken(token);
    console.log(`[Auth] User: ${userEmail}`);

    if (!userEmail) {
      console.log("[Auth] Invalid token");
      return Response.json(
        { error: "Invalid token. Use your Mentra email address as the Bearer token." },
        { status: 401 }
      );
    }

    // POST - JSON-RPC requests
    if (req.method === "POST") {
      try {
        const body = await req.json();
        let mcpSessionId = req.headers.get("Mcp-Session-Id");

        // Create or update MCP session
        if (!mcpSessionId || !mcpSessions.has(mcpSessionId)) {
          mcpSessionId = generateSessionId();
        }
        mcpSessions.set(mcpSessionId, { userEmail, lastSeen: Date.now() });

        // Process request with user context
        const response = await processJsonRpc(body, userEmail);

        // Handle notifications (no response)
        if (response === null) {
          return new Response(null, { status: 202, headers: { "Mcp-Session-Id": mcpSessionId } });
        }

        const accept = req.headers.get("Accept") || "";

        if (accept.includes("text/event-stream")) {
          return createSSEResponse(response, mcpSessionId);
        }

        return Response.json(response, { headers: { "Mcp-Session-Id": mcpSessionId } });
      } catch (e: any) {
        return Response.json({ jsonrpc: "2.0", error: { code: -32700, message: e.message } }, { status: 400 });
      }
    }

    // GET - SSE stream
    if (req.method === "GET") {
      const accept = req.headers.get("Accept") || "";
      if (!accept.includes("text/event-stream")) {
        return new Response("Not Acceptable", { status: 406 });
      }
      return createSSEStream(req);
    }

    // DELETE - terminate session
    if (req.method === "DELETE") {
      const sessionId = req.headers.get("Mcp-Session-Id");
      if (sessionId) {
        mcpSessions.delete(sessionId);
        return new Response(null, { status: 204 });
      }
      return new Response("Session ID required", { status: 400 });
    }

    return new Response("Method not allowed", { status: 405 });
  }

  return new Response("Not Found", { status: 404 });
}

// --- Proxy to Mentra AppServer ---
async function proxyToMentra(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mentraUrl = `http://127.0.0.1:${config.internalPort}${url.pathname}${url.search}`;
  
  try {
    const proxyReq = new Request(mentraUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });
    
    return await fetch(proxyReq);
  } catch (e: any) {
    return new Response(`Mentra proxy error: ${e.message}`, { status: 502 });
  }
}

// --- Unified Request Handler ---
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // MCP endpoints
  if (url.pathname === "/mcp" || url.pathname === "/health") {
    return handleMCPRequest(req);
  }
  
  // Everything else goes to Mentra AppServer
  return proxyToMentra(req);
}

// --- Start ---
async function main() {
  console.log("🚀 Starting Mentra Glass MCP Server...\n");
  console.log("🔐 User Isolation: Each MCP client uses their email as Bearer token");
  console.log("   Only sees/controls their own connected glasses\n");

  // Start Mentra AppServer on internal port
  const mentraApp = new MentraService();
  await mentraApp.start();
  console.log(`📱 Mentra AppServer: internal port ${config.internalPort}`);

  // Start unified Bun HTTP server on main port
  Bun.serve({
    port: config.port,
    hostname: "0.0.0.0",
    fetch: handleRequest,
    idleTimeout: 255, // Keep SSE connections alive
  });

  console.log(`\n🌐 Server running on: http://localhost:${config.port}`);
  console.log(`   /mcp     - MCP JSON-RPC endpoint`);
  console.log(`   /health  - Health check`);
  console.log(`   /*       - Mentra webhooks (proxied)`);
  console.log(`\n📋 Available Tools (user-scoped):`);
  ALL_TOOLS.forEach((t) => console.log(`   - ${t.name}`));
  console.log(`\n🔑 Auth: Bearer <your-mentra-email>`);
  console.log("   Example: Authorization: Bearer user@example.com");
  if (config.adminToken) console.log(`   Admin token configured for debugging`);
  console.log("\n✨ Ready! Use ngrok: ngrok http 3000\n");
}

main().catch(console.error);
