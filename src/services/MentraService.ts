import { AppServer, AppSession, ViewType } from "@mentra/sdk";
import { config, debugLog } from "../config/env";
import { sessionManager, GlassesSession } from "./SessionManager";
import { tokenService } from "./TokenService";
import type { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

export class MentraService extends AppServer {
  constructor() {
    super({
      packageName: config.packageName,
      apiKey: config.apiKey,
      port: config.internalPort,
    });

    this.setupWebview();
  }

  private setupWebview() {
    const app = this.getExpressApp();

    app.get("/webview", async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.authUserId;

      if (userId) {
        const token = await tokenService.getOrCreateToken(userId);
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Mentra MCP Settings</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: -apple-system, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #fff; color: #000; }
                .card { border: 1px solid #eee; border-radius: 12px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .token { background: #f5f5f7; padding: 16px; font-family: monospace; font-size: 1.2em; border-radius: 8px; word-break: break-all; margin: 10px 0; text-align: center; font-weight: bold; color: #007aff; }
                h1 { font-size: 1.8em; margin-bottom: 8px; }
                .user { color: #888; font-size: 0.9em; margin-bottom: 30px; }
                h3 { margin-top: 0; font-size: 1.1em; }
                p { color: #555; line-height: 1.5; }
                .config-item { margin-bottom: 10px; }
                .label { font-weight: 600; font-size: 0.85em; text-transform: uppercase; color: #888; }
                .value { font-family: monospace; background: #f5f5f7; padding: 4px 8px; border-radius: 4px; }
              </style>
            </head>
            <body>
              <h1>MCP Server</h1>
              <div class="user">Connected as: ${userId}</div>
              
              <div class="card">
                <h3>Access Token</h3>
                <p>Use this passphrase to connect your MCP client.</p>
                <div class="token">${token}</div>
              </div>

              <div class="card">
                <h3>Configuration</h3>
                <div class="config-item">
                  <div class="label">Server URL</div>
                  <div class="value">${req.protocol}://${req.get('host')}/mcp</div>
                </div>
                <div class="config-item">
                  <div class="label">Authorization Header</div>
                  <div class="value">Bearer ${token}</div>
                </div>
              </div>
            </body>
          </html>
        `;
        res.send(html);
      } else {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Login Required</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: -apple-system, sans-serif; padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; }
                h1 { margin-bottom: 20px; }
                p { color: #666; margin-bottom: 40px; }
                .btn { display: inline-block; transition: transform 0.2s; }
                .btn:active { transform: scale(0.95); }
              </style>
            </head>
            <body>
              <h1>Authentication Required</h1>
              <p>Please log in to view your MCP settings and access token.</p>
              <a href="/mentra-auth" class="btn">
                <img src="https://account.mentra.glass/sign-in-mentra.png" alt="Sign in with Mentra" width="240" />
              </a>
            </body>
          </html>
        `;
        res.send(html);
      }
    });
  }

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    debugLog(`Glasses connected: ${userId}`);

    const data: GlassesSession = { session, userId, transcriptions: [], events: [] };
    sessionManager.addSession(sessionId, data);

    // Voice transcription listener
    session.events.onTranscription((t) => {
      debugLog(`Transcription [${userId}]:`, t.text, { final: t.isFinal });
      data.transcriptions.push({ text: t.text, isFinal: t.isFinal, timestamp: new Date().toISOString() });
      if (data.transcriptions.length > 100) data.transcriptions.shift();
    });

    // Button events
    session.events.onButtonPress?.((d: any) => {
      debugLog(`Button [${userId}]:`, d);
      data.events.push({ type: "button", data: d, timestamp: new Date().toISOString() });
      if (data.events.length > 50) data.events.shift();
    });

    // Handle disconnect
    session.events.onDisconnect?.(() => {
      debugLog(`Glasses disconnected: ${userId}`);
      sessionManager.removeSession(sessionId);
    });
  }
}
