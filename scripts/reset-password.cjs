const { Client } = require("pg");
const { hash } = require("bcryptjs");

async function main() {
  const [, , usernameArg, passwordArg] = process.argv;
  const username = String(usernameArg || "").trim().toLowerCase();
  const password = String(passwordArg || "");
  if (!/^[a-z0-9_-]{3,32}$/.test(username)) throw new Error("Gültigen Benutzernamen angeben.");
  if (password.length < 8 || password.length > 128) throw new Error("Passwort muss 8 bis 128 Zeichen lang sein.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL fehlt.");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('UPDATE "User" SET "passwordHash"=$1, "updatedAt"=NOW() WHERE LOWER("username")=$2', [await hash(password, 12), username]);
    if (!result.rowCount) throw new Error("Account nicht gefunden.");
    console.log(`Passwort für ${username} wurde geändert.`);
  } finally { await client.end(); }
}
main().catch((error) => { console.error(error.message || error); process.exit(1); });
