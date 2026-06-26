const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt.");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const migrationDir = path.join(__dirname, "../database/migrations");
    const files = fs.readdirSync(migrationDir).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      await client.query(sql);
      console.log(`Migration angewendet: ${file}`);
    }
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error(error); process.exit(1); });
