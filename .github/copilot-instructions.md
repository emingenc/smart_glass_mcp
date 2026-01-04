# Copilot Instructions

## What this repo is

MCP server for controlling MentraOS smart glasses. Uses Next.js + `mcp-handler` + `@mentra/sdk`.

## Architecture

```
MCP Client → /mcp → @mentra/sdk → MentraOS Cloud → Phone → Glasses
```

One server. No bridges. No Redis.

## Key files

- `app/mcp/route.ts` — MCP tools + Mentra AppServer
- `PRODUCT.md` — Setup guide

## Rules

1. Keep it simple
2. Use `@mentra/sdk` directly
3. Sessions are in-memory
4. Auth via `Authorization: Bearer` + `MCP_API_KEYS` env
5. Validate with zod
6. Never log secrets

## Adding tools

```typescript
server.tool("glasses.xyz", "Description", { input: z.string() }, async ({ input }) => {
  const session = sessions.get(sessionId);
  session.layouts.showTextWall(input);
  return { content: [{ type: "text", text: "Done" }] };
});
```

Update `capabilities.tools` to match.
