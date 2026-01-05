import { Database } from "bun:sqlite";
import { DatabaseAdapter, UserToken } from "./Database";
import * as fs from "fs";
import * as path from "path";

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database;

  constructor(dbPath: string = "mcp.sqlite") {
    this.db = new Database(dbPath);
  }

  async init(): Promise<void> {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        email TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        created_at INTEGER
      )
    `);
    // Index for fast token lookups
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_token ON tokens(token)`);

    // Migration: Import from tokens.json if exists and table is empty
    const count = this.db.query("SELECT COUNT(*) as count FROM tokens").get() as { count: number };
    if (count.count === 0) {
      const tokenFile = path.join(process.cwd(), "src", "tokens.json");
      if (fs.existsSync(tokenFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(tokenFile, "utf-8"));
          const insert = this.db.prepare("INSERT INTO tokens (email, token, created_at) VALUES (?, ?, ?)");
          const now = Date.now();
          this.db.transaction(() => {
            for (const [email, token] of Object.entries(data)) {
              insert.run(email, token as string, now);
            }
          })();
        } catch {
          // Silent fail - migration is optional
        }
      }
    }
  }

  async getToken(email: string): Promise<string | null> {
    const result = this.db.query("SELECT token FROM tokens WHERE email = ?").get(email) as { token: string } | null;
    return result?.token || null;
  }

  async getUserByToken(token: string): Promise<string | null> {
    const result = this.db.query("SELECT email FROM tokens WHERE token = ?").get(token) as { email: string } | null;
    return result?.email || null;
  }

  async saveToken(email: string, token: string): Promise<void> {
    this.db.run(
      "INSERT OR REPLACE INTO tokens (email, token, created_at) VALUES (?, ?, ?)",
      [email, token, Date.now()]
    );
  }

  async getAllTokens(): Promise<UserToken[]> {
    const results = this.db.query("SELECT * FROM tokens").all() as any[];
    return results.map(r => ({
      email: r.email,
      token: r.token,
      createdAt: r.created_at
    }));
  }
}
