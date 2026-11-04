import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import postgres from "postgres";

const scrypt = promisify(scryptCallback);

function fail(message) {
  throw new Error(message);
}

function readConfiguration() {
  const connectionString = process.env.DATABASE_LIVE_MIGRATION_URL;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!connectionString) fail("DATABASE_LIVE_MIGRATION_URL belum diatur.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("BOOTSTRAP_ADMIN_EMAIL harus berupa alamat email yang valid.");
  }
  if (!password || password.length < 12 || password.length > 128) {
    fail("BOOTSTRAP_ADMIN_PASSWORD harus 12â€“128 karakter.");
  }

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    fail("DATABASE_LIVE_MIGRATION_URL tidak valid.");
  }
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "db" ||
    url.port !== "5432" ||
    url.pathname !== "/kgj" ||
    url.username !== "postgres" ||
    (url.searchParams.get("sslmode") &&
      url.searchParams.get("sslmode") !== "disable")
  ) {
    fail(
      "URL bootstrap harus menunjuk ke owner database internal db:5432/kgj tanpa TLS.",
    );
  }

  return { connectionString, email, password };
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt-v1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function main() {
  const configuration = readConfiguration();
  const passwordHash = await hashPassword(configuration.password);
  if (!/^scrypt-v1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/.test(passwordHash)) {
    fail("hash kata sandi bootstrap tidak valid.");
  }

  const sql = postgres(configuration.connectionString, { max: 1, ssl: false });
  try {
    await sql.begin(async (transaction) => {
      const [sameEmail] = await transaction`
        select id, password_hash
        from admin_profiles
        where email = ${configuration.email}
        for update
      `;
      if (sameEmail?.password_hash) {
        fail(
          "email bootstrap sudah dimiliki akun CMS berpassword; gunakan CMS untuk mengelola akun.",
        );
      }

      const technicalAdmin = await transaction`
        select id
        from admin_profiles
        where role = 'technical_admin'
          and password_hash is not null
        for update
      `;
      if (technicalAdmin.length > 0) {
        fail(
          "technical_admin dengan kata sandi sudah ada; gunakan CMS untuk mengelola akun.",
        );
      }

      const [profile] = await transaction`
        insert into admin_profiles (
          id, email, password_hash, role, is_active, updated_at
        ) values (
          ${randomUUID()}, ${configuration.email}, ${passwordHash}, 'technical_admin', true, now()
        )
        on conflict (email) do update
        set password_hash = excluded.password_hash,
            role = 'technical_admin',
            is_active = true,
            updated_at = now()
        returning id
      `;

      await transaction`delete from admin_sessions where admin_id = ${profile.id}`;
      await transaction`
        insert into audit_logs (admin_id, action, entity_type, entity_id, changes)
        values (
          ${profile.id},
          'bootstrap',
          'admin_profiles',
          ${profile.id},
          ${JSON.stringify({ fields: ["email", "password", "role", "isActive"] })}::jsonb
        )
      `;
    });
    console.log(`Technical admin siap untuk ${configuration.email}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`Bootstrap dibatalkan: ${error.message}`);
  process.exit(1);
});
