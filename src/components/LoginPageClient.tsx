"use client";

import Link from "next/link";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface LoginPageClientProps {
  errorMessage: string | null;
  nextPath: string;
  showLogout: boolean;
  loginAction: (formData: FormData) => void;
}

export function LoginPageClient({
  errorMessage,
  nextPath,
  showLogout,
  loginAction,
}: LoginPageClientProps) {
  const { lang } = useLanguage();

  const translatedError = errorMessage
    ? errorMessage === "__LOGIN_ERROR__"
      ? t("login.errorLogin", lang)
      : errorMessage
    : null;

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        {showLogout ? (
          <div
            className="mb-6 border-l-4 border-emerald-500/60 px-4 py-3 text-sm text-emerald-200"
            style={{ background: "var(--black-rich)" }}
          >
            {t("login.loggedOut", lang)}
          </div>
        ) : null}

        {translatedError ? (
          <div
            className="mb-6 border-l-4 border-red-500/60 px-4 py-3 text-sm text-red-300"
            style={{ background: "var(--black-rich)" }}
          >
            {translatedError}
          </div>
        ) : null}

        <div className="card-panel p-8">
          <p className="section-kicker">{lang === "cs" ? "Administrace" : "Administration"}</p>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lang === "cs" ? "Přihlášení do CMS" : "CMS Login"}
          </h1>
          <p className="mt-4 text-sm text-secondary">
            {lang === "cs"
              ? "Zadejte přihlašovací údaje pro přístup do administračního rozhraní."
              : "Enter your credentials to access the administration panel."}
          </p>

          <form action={loginAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                {t("login.identifier", lang)}
              </label>
              <input
                name="identifier"
                type="text"
                required
                autoComplete="username"
                className="login-input mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                {t("login.passwordLabel", lang)}
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="login-input mt-1 w-full"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              {t("login.submit", lang)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
