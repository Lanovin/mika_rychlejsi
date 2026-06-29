import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "user";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

const SESSION_COOKIE = "mika-user-session";
const authSecret = process.env.AUTH_SESSION_SECRET ?? "mika-auth-secret-change-me";

/**
 * Admin přihlašovací údaje se berou výhradně z prostředí (env).
 * V kódu není uložené žádné konkrétní heslo.
 *
 * Dokud nejsou nastavené OBĚ proměnné ADMIN_LOGIN i ADMIN_PASSWORD,
 * je admin přihlášení vypnuté (nelze se přihlásit).
 *
 * Na Vercelu: po změně těchto proměnných je nutný Redeploy.
 */
function getAdminCredentials() {
  const username = (process.env.ADMIN_LOGIN ?? "").trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  return { username, password };
}

/** Konstantně-časové porovnání dvou řetězců (přes jejich sha256 otisk). */
function safeEqual(a: string, b: string) {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

function signPayload(payload: string) {
  return createHmac("sha256", authSecret).update(payload).digest("hex");
}

function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) {
    return null;
  }
  return decodeSession(value);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export async function requireAdminAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login?next=%2Fadmin");
  }
  if (user.role !== "admin") {
    redirect("/ucet?admin=0");
  }
  return user;
}

export async function loginUser(identifier: string, password: string): Promise<SessionUser | null> {
  const { username, password: adminPassword } = getAdminCredentials();

  // Bez nastavených env proměnných se nelze přihlásit (žádné heslo v kódu).
  if (!username || !adminPassword) {
    return null;
  }

  const matchesIdentifier = safeEqual(identifier.trim().toLowerCase(), username.toLowerCase());
  const matchesPassword = safeEqual(password, adminPassword);

  if (!matchesIdentifier || !matchesPassword) {
    return null;
  }

  const sessionUser: SessionUser = {
    id: "admin",
    username,
    email: `${username}@mikaauto.local`,
    role: "admin"
  };

  await setSession(sessionUser);
  return sessionUser;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
