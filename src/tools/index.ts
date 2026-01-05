import { displayTools } from "./display";
import { audioTools } from "./audio";
import { inputTools } from "./input";
import { systemTools } from "./system";

export const ALL_TOOLS = [
  ...displayTools,
  ...audioTools,
  ...inputTools,
  ...systemTools,
];

export async function executeTool(
  name: string,
  args: Record<string, any>,
  userEmail: string
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const tool = ALL_TOOLS.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    return await tool.handler(args, userEmail);
  } catch (e: any) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
}
