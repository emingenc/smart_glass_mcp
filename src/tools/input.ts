import { sessionManager } from "../services/SessionManager";

export const inputTools = [
  {
    name: "glasses_get_transcriptions",
    description: "Get YOUR voice transcriptions from glasses microphone (voice input)",
    inputSchema: {
      type: "object" as const,
      properties: {
        onlyFinal: { type: "boolean", description: "Only return final transcriptions (default true)" },
        clear: { type: "boolean", description: "Clear buffer after reading (default false)" },
      },
    },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected." }] };
      
      let data = [...glasses.transcriptions];
      if (args.onlyFinal !== false) data = data.filter((t) => t.isFinal);
      if (args.clear) glasses.transcriptions = [];
      
      if (data.length === 0) {
        return { content: [{ type: "text", text: "No voice input yet. Speak into your glasses microphone." }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  },
  {
    name: "glasses_get_events",
    description: "Get button and touch events from YOUR glasses",
    inputSchema: {
      type: "object" as const,
      properties: {
        clear: { type: "boolean", description: "Clear buffer after reading" },
      },
    },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected." }] };
      
      const data = [...glasses.events];
      if (args.clear) glasses.events = [];
      return { content: [{ type: "text", text: data.length ? JSON.stringify(data, null, 2) : "No button/touch events" }] };
    }
  }
];
