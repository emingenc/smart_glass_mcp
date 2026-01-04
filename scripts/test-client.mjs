import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SERVER_URL = process.env.MCP_URL || "http://localhost:3000/mcp";
const AUTH_TOKEN = process.env.MCP_TOKEN || "user@example.com";

async function main() {
  // Append token to URL for fallback
  const urlWithToken = new URL(SERVER_URL);
  urlWithToken.searchParams.set("token", AUTH_TOKEN);
  
  console.log(`🔌 Connecting to MCP server at ${urlWithToken.toString()}...`);

  const transport = new SSEClientTransport(urlWithToken, {
    eventSourceInit: {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    },
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected!");

    // List tools
    console.log("\n🛠️  Listing tools...");
    const tools = await client.listTools();
    console.log(tools.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n"));

    // Call a tool (e.g., system status)
    console.log("\n🔋 Checking battery...");
    // Note: This might fail if no glasses are connected, but it tests the protocol
    try {
      const result = await client.callTool({
        name: "get_battery",
        arguments: {},
      });
      console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
      console.log("Tool call failed (expected if no glasses):", e.message);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // await client.close(); // Keep open if needed, or close
    process.exit(0);
  }
}

main();
