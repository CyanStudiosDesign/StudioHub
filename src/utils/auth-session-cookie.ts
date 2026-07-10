import { cookies } from "next/headers";

const APP_SESSION_COOKIE = "studio_hub_session";

export async function setAppSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: APP_SESSION_COOKIE,
    value: "active",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAppSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(APP_SESSION_COOKIE);
}
