import { ViewType } from "@mentra/sdk";
import { sessionManager } from "../services/SessionManager";

export const displayTools = [
  {
    name: "glasses_display_text",
    description: "Display text on YOUR connected smart glasses HUD. Long text is auto-chunked and displayed sequentially.",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text to display (auto-chunks if over 120 chars)" },
        durationMs: { type: "number", description: "Duration per chunk in ms (500-60000, default 3000)" },
      },
      required: ["text"],
    },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected. Open the app on your glasses to connect." }] };
      
      const text = args.text.slice(0, 2000);
      const durationMs = Math.min(Math.max(args.durationMs || 3000, 500), 60000);
      const chunkSize = 120;
      
      // If short text, display directly
      if (text.length <= chunkSize) {
        glasses.session.layouts.showTextWall(text, { 
          view: ViewType.MAIN, 
          durationMs 
        });
        return { content: [{ type: "text", text: `✅ Displayed on your glasses: "${text}"` }] };
      }
      
      // Split long text into chunks and display sequentially
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      
      // Display chunks with proper delays
      (async () => {
        for (const chunk of chunks) {
          glasses.session.layouts.showTextWall(chunk, { 
            view: ViewType.MAIN, 
            durationMs 
          });
          await new Promise(resolve => setTimeout(resolve, durationMs));
        }
      })();
      
      return { content: [{ type: "text", text: `✅ Displaying "${text.slice(0, 50)}..." in ${chunks.length} chunks` }] };
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
