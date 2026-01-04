import { AppServer, AppSession, ViewType } from "@mentra/sdk";
import { config } from "../config/env";
import { sessionManager, GlassesSession } from "./SessionManager";

export class MentraService extends AppServer {
  constructor() {
    super({
      packageName: config.packageName,
      apiKey: config.apiKey,
      port: config.internalPort,
    });
  }

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    console.log(`✅ Glasses connected: ${userId}`);

    const data: GlassesSession = { session, userId, transcriptions: [], events: [] };
    sessionManager.addSession(sessionId, data);

    session.layouts.showTextWall("Glass MCP Ready!", { view: ViewType.MAIN, durationMs: 2000 });

    // Voice transcription listener
    session.events.onTranscription((t) => {
      console.log(`🎤 [${userId}]:`, t.text, { final: t.isFinal });
      data.transcriptions.push({ text: t.text, isFinal: t.isFinal, timestamp: new Date().toISOString() });
      if (data.transcriptions.length > 100) data.transcriptions.shift();
    });

    // Button events
    session.events.onButtonPress?.((d: any) => {
      console.log(`🔘 Button [${userId}]:`, d);
      data.events.push({ type: "button", data: d, timestamp: new Date().toISOString() });
      if (data.events.length > 50) data.events.shift();
    });

    // Handle disconnect
    session.events.onDisconnect?.(() => {
      console.log(`❌ Glasses disconnected: ${userId}`);
      sessionManager.removeSession(sessionId);
    });
  }
}
