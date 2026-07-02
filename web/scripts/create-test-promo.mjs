import "dotenv/config";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function main() {
  console.log("Seeding test promo codes...");
  
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("TURSO_DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const codes = [
    { code: "FREE30", duration_days: 30, max_uses: null, expires_at: null },
    { code: "WELCOME7", duration_days: 7, max_uses: 100, expires_at: null }
  ];

  try {
    for (const item of codes) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO promo_codes (code, duration_days, expires_at, max_uses, uses_count, created_at)
              VALUES (?, ?, ?, ?, 0, ?)`,
        args: [
          item.code,
          item.duration_days,
          item.expires_at,
          item.max_uses,
          Math.floor(Date.now() / 1000)
        ]
      });
      console.log(`✓ Seeded code: ${item.code} (${item.duration_days} days)`);
    }
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding promo codes:", error);
    process.exit(1);
  }
}

main();
