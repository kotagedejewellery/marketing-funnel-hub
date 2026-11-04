import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDatabase } from "@/lib/db/client";
import { adminProfiles, adminSessions } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keyLength: number,
) => Promise<Buffer>;
const passwordHashVersion = "scrypt-v1";
const sessionMaxAge = 7 * 24 * 60 * 60;

export const adminSessionCookieName = "kgj_admin_session";

function sessionTokenHash(token: string) {
  return createHmac("sha256", serverEnv.ADMIN_SESSION_SECRET)
    .update(token)
    .digest("base64url");
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const derived = Buffer.from(await scrypt(password, salt, 64));
  return `${passwordHashVersion}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, stored: string) {
  const [version, salt, hash] = stored.split("$");
  if (version !== passwordHashVersion || !salt || !hash) return false;

  try {
    const derived = Buffer.from(
      await scrypt(password, Buffer.from(salt, "base64url"), 64),
    );
    const expected = Buffer.from(hash, "base64url");
    return (
      expected.length === derived.length && timingSafeEqual(expected, derived)
    );
  } catch {
    return false;
  }
}

export function adminSessionCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: serverEnv.NEXT_PUBLIC_APP_ENV !== "local",
    path: "/",
    maxAge: sessionMaxAge,
  };
}

export async function signInAdmin(email: string, password: string) {
  const [profile] = await getDatabase()
    .select({
      id: adminProfiles.id,
      passwordHash: adminProfiles.passwordHash,
      isActive: adminProfiles.isActive,
    })
    .from(adminProfiles)
    .where(eq(adminProfiles.email, email.trim().toLowerCase()))
    .limit(1);

  if (!profile?.isActive || !profile.passwordHash) return null;
  if (!(await verifyAdminPassword(password, profile.passwordHash))) return null;

  const token = randomBytes(32).toString("base64url");
  const db = getDatabase();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
    await tx.insert(adminSessions).values({
      adminId: profile.id,
      tokenHash: sessionTokenHash(token),
      expiresAt: new Date(now.getTime() + sessionMaxAge * 1000),
    });
  });
  return token;
}

export async function getCurrentAdminProfile() {
  const token = (await cookies()).get(adminSessionCookieName)?.value;
  if (!token) return null;

  const [session] = await getDatabase()
    .select({
      id: adminProfiles.id,
      email: adminProfiles.email,
      displayName: adminProfiles.displayName,
      role: adminProfiles.role,
      isActive: adminProfiles.isActive,
    })
    .from(adminSessions)
    .innerJoin(adminProfiles, eq(adminSessions.adminId, adminProfiles.id))
    .where(
      and(
        eq(adminSessions.tokenHash, sessionTokenHash(token)),
        gt(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return session?.isActive ? session : null;
}

export async function signOutAdmin(token: string | undefined) {
  if (!token) return;
  await getDatabase()
    .delete(adminSessions)
    .where(eq(adminSessions.tokenHash, sessionTokenHash(token)));
}
