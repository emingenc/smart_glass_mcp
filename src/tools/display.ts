import { ViewType } from "@mentra/sdk";
import { sessionManager } from "../services/SessionManager";

export const displayTools = [
  {
    name: "glasses_display_text",
    description: "Display text on YOUR connected smart glasses HUD",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text to display (max 500 chars)" },
        durationMs: { type: "number", description: "Duration in ms (500-60000, default 4000)" },
      },
      required: ["text"],
    },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected. Open the app on your glasses to connect." }] };
      
      glasses.session.layouts.showTextWall(args.text.slice(0, 500), { 
        view: ViewType.MAIN, 
        durationMs: Math.min(Math.max(args.durationMs || 4000, 500), 60000) 
      });
      return { content: [{ type: "text", text: `✅ Displayed on your glasses: "${args.text}"` }] };
    }
  },
  {
    name: "glasses_clear_display",
    description: "Clear YOUR glasses display",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected." }] };
      
      glasses.session.layouts.clearView({ view: ViewType.MAIN });
      return { content: [{ type: "text", text: "✅ Your glasses display cleared" }] };
    }
  }
];
