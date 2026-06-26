const { Client } = require("pg");
const { hash } = require("bcryptjs");
const { randomUUID } = require("crypto");

async function main() {
  const [, , usernameArg, passwordArg] = process.argv;
  const username = String(usernameArg || "").trim().toLowerCase();
  const password = String(passwordArg || "");

  if (!/^[a-z0-9_-]{3,32}$/.test(username)) throw new Error("Benutzername: 3 bis 32 Zeichen, nur Buchstaben, Zahlen, _ und -.");
  if (password.length < 8 || password.length > 128) throw new Error("Passwort muss 8 bis 128 Zeichen lang sein.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt.");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const existing = await client.query('SELECT "id" FROM "User" WHERE LOWER("username")=$1 LIMIT 1', [username]);
    if (existing.rows[0]) throw new Error("Dieser Benutzername ist bereits vergeben.");
    await client.query(
      'INSERT INTO "User" ("id", "email", "username", "displayName", "passwordHash", "preferredDarkMode", "createdAt", "updatedAt") VALUES ($1,NULL,$2,$2,$3,TRUE,NOW(),NOW())',
      [randomUUID(), username, await hash(password, 12)]
    );
    console.log(`Account ${username} wurde angelegt.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
