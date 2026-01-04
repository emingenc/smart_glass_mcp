import { randomInt } from "crypto";
import * as fs from "fs";
import * as path from "path";

// Expanded word lists for higher entropy
const ADJECTIVES = [
  "happy", "purple", "brave", "calm", "swift", "bright", "silent", "wise",
  "ancient", "modern", "fast", "slow", "green", "blue", "red", "yellow",
  "quiet", "loud", "soft", "hard", "smooth", "rough", "cold", "hot",
  "wild", "tame", "proud", "humble", "rich", "poor", "strong", "weak",
  "clever", "foolish", "kind", "cruel", "sweet", "sour", "fresh", "stale",
  "golden", "silver", "bronze", "iron", "steel", "wooden", "stone", "glass",
  "sunny", "rainy", "windy", "snowy", "stormy", "cloudy", "misty", "foggy"
];

const NOUNS = [
  "tiger", "eagle", "ocean", "mountain", "forest", "river", "star", "moon",
  "lion", "wolf", "bear", "hawk", "shark", "whale", "dolphin", "seal",
  "tree", "flower", "grass", "leaf", "root", "branch", "seed", "fruit",
  "stone", "rock", "sand", "dust", "clay", "mud", "dirt", "soil",
  "fire", "water", "air", "earth", "metal", "wood", "ice", "steam",
  "king", "queen", "prince", "knight", "wizard", "witch", "giant", "elf",
  "city", "town", "village", "castle", "tower", "bridge", "road", "path"
];

const VERBS = [
  "jump", "fly", "run", "swim", "glow", "sing", "dance", "dream",
  "walk", "crawl", "climb", "dive", "float", "sink", "rise", "fall",
  "eat", "drink", "sleep", "wake", "talk", "shout", "whisper", "listen",
  "look", "watch", "see", "hear", "touch", "feel", "smell", "taste",
  "build", "break", "fix", "make", "create", "destroy", "save", "help",
  "learn", "teach", "read", "write", "draw", "paint", "play", "work"
];

const TOKEN_FILE = path.join(process.cwd(), "src", "tokens.json");

class TokenService {
  private tokens = new Map<string, string>(); // token -> email
  private userTokens = new Map<string, string>(); // email -> token

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        const data = fs.readFileSync(TOKEN_FILE, "utf-8");
        const json = JSON.parse(data);
        for (const [email, token] of Object.entries(json)) {
          this.tokens.set(token as string, email);
          this.userTokens.set(email, token as string);
        }
        console.log(`[TokenService] Loaded ${this.tokens.size} tokens from disk`);
      }
    } catch (e) {
      console.error("[TokenService] Failed to load tokens:", e);
    }
  }

  private saveTokens() {
    try {
      const data: Record<string, string> = {};
      for (const [email, token] of this.userTokens.entries()) {
        data[email] = token;
      }
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("[TokenService] Failed to save tokens:", e);
    }
  }

  // Generate a secure readable passphrase (e.g., "purple-tiger-jump-83921")
  private generatePassphrase(): string {
    const adj = ADJECTIVES[randomInt(ADJECTIVES.length)];
    const noun = NOUNS[randomInt(NOUNS.length)];
    const verb = VERBS[randomInt(VERBS.length)];
    // Add 6 digits of entropy (0-999999)
    const suffix = randomInt(0, 1000000).toString().padStart(6, '0');
    
    return `${adj}-${noun}-${verb}-${suffix}`;
  }

  // Get or create a token for a user
  getOrCreateToken(email: string): string {
    if (this.userTokens.has(email)) {
      return this.userTokens.get(email)!;
    }

    const token = this.generatePassphrase();
    this.tokens.set(token, email);
    this.userTokens.set(email, token);
    this.saveTokens(); // Persist to disk
    return token;
  }

  // Validate token
  validateToken(token: string): string | null {
    return this.tokens.get(token) || null;
  }
  
  // Initialize with config tokens
  loadConfigTokens(tokens: Record<string, string>) {
    for (const [token, email] of Object.entries(tokens)) {
      this.tokens.set(token, email);
      this.userTokens.set(email, token);
    }
    this.saveTokens();
  }
}

export const tokenService = new TokenService();
