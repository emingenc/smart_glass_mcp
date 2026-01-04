import { config } from "../config/env";
import { sessionManager } from "../services/SessionManager";

export const systemTools = [
  {
    name: "glasses_status",
    description: "Check if YOUR glasses are connected",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) {
        return { content: [{ type: "text", text: `❌ Your glasses are not connected.\n\nTo connect:\n1. Open Mentra app on your phone\n2. Connect your glasses\n3. Open the "${config.packageName}" app` }] };
      }
      return { content: [{ type: "text", text: `✅ Your glasses are connected!\n\n📊 Status:\n- Buffered transcriptions: ${glasses.transcriptions.length}\n- Buffered events: ${glasses.events.length}` }] };
    }
  }
];
