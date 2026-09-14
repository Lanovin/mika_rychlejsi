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

/**
 * Tajný klíč pro podpis session. Repozitář je veřejný, takže výchozí
 * hodnota v kódu by v produkci znamenala, že si kdokoli podepíše admin
 * cookie sám. Bez AUTH_SESSION_SECRET se proto v produkci nepřihlásí nikdo –
 * lepší nefunkční admin než cizí ruce v CMS. Mimo produkci zůstává vývojový
 * klíč, aby šel web spustit bez konfigurace.
 */
function resolveAuthSecret(): string | null {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] AUTH_SESSION_SECRET není nastavený – přihlášení do administrace je vypnuté.");
    return null;
  }
  return "mika-dev-only-secret";
}

const authSecret = resolveAuthSecret();

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

function signPayload(payload: string): string | null {
  if (!authSecret) return null;
  return createHmac("sha256", authSecret).update(payload).digest("hex");
}

function encodeSession(user: SessionUser): string | null {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = signPayload(payload);
  return signature ? `${payload}.${signature}` : null;
}

function decodeSession(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  if (!expected || !safeEqual(expected, signature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

async function setSession(user: SessionUser): Promise<boolean> {
  const encoded = encodeSession(user);
  if (!encoded) return false;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return true;
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

  const stored = await setSession(sessionUser);
  return stored ? sessionUser : null;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
