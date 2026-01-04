import { sessionManager } from "../services/SessionManager";

export const audioTools = [
  {
    name: "glasses_speak",
    description: "Speak text using TTS on YOUR smart glasses",
    inputSchema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text to speak" },
      },
      required: ["text"],
    },
    handler: async (args: any, userEmail: string) => {
      const glasses = sessionManager.getUserSession(userEmail);
      if (!glasses) return { content: [{ type: "text", text: "⚠️ Your glasses are not connected." }] };
      
      // Don't await to avoid blocking MCP client if speech takes time
      glasses.session.audio.speak(args.text).catch((e: any) => console.error(`Error speaking: ${e.message}`));
      return { content: [{ type: "text", text: `🔊 Speaking on your glasses: "${args.text}"` }] };
    }
  }
];
