import { NextResponse } from "next/server";
import * as z from "zod";

import {
  adminSessionCookie,
  adminSessionCookieName,
  signInAdmin,
  signOutAdmin,
} from "@/modules/admin/auth";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function sessionToken(request: Request) {
  return request.headers
    .get("cookie")
    ?.match(/(?:^|; )kgj_admin_session=([^;]+)/)?.[1];
}

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { message: "Email atau kata sandi tidak sesuai." },
      { status: 400 },
    );

  const token = await signInAdmin(parsed.data.email, parsed.data.password);
  if (!token)
    return NextResponse.json(
      { message: "Email atau kata sandi tidak sesuai." },
      { status: 401 },
    );

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, token, adminSessionCookie());
  return response;
}

export async function DELETE(request: Request) {
  await signOutAdmin(sessionToken(request));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, "", {
    ...adminSessionCookie(),
    maxAge: 0,
  });
  return response;
}
