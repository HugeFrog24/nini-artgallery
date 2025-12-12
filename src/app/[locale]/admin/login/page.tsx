"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

interface LoginState {
  step: "email" | "otp";
  email: string;
  otp: string;
  loading: boolean;
  error: string;
  success: string;
  configured: boolean;
  configLoading: boolean;
}

export default function AdminLogin() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const [state, setState] = useState<LoginState>({
    step: "email",
    email: "",
    otp: "",
    loading: false,
    error: "",
    success: "",
    configured: false,
    configLoading: true,
  });

  const updateState = (updates: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const checkAdminConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/config");
      const data = await response.json();

      updateState({
        configured: data.configured,
        configLoading: false,
        error: "",
      });
    } catch {
      updateState({
        configured: false,
        configLoading: false,
        error: t("Errors.checkAdminConfiguration"),
      });
    }
  }, [t]);

  // Check admin configuration on component mount
  useEffect(() => {
    checkAdminConfig();
  }, [checkAdminConfig]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ loading: true, error: "", success: "" });

    try {
      const response = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          step: "otp",
          loading: false,
          success: data.message,
        });
      } else {
        updateState({
          loading: false,
          error: data.message,
        });
      }
    } catch {
      updateState({
        loading: false,
        error: t("Login.networkError"),
      });
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ loading: true, error: "", success: "" });

    try {
      const response = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, otp: state.otp }),
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          loading: false,
          success: t("Login.loginSuccessful"),
        });

        // Redirect to localized admin dashboard
        setTimeout(() => {
          router.push(`/${locale}/admin`);
        }, 1000);
      } else {
        updateState({
          loading: false,
          error: data.message,
        });
      }
    } catch {
      updateState({
        loading: false,
        error: t("Login.networkError"),
      });
    }
  };

  const handleBackToEmail = () => {
    updateState({
      step: "email",
      otp: "",
      error: "",
      success: "",
    });
  };

  if (state.configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t("Dashboard.checkingConfiguration")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t("Login.title")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {!state.configured
              ? t("Login.notAvailable")
              : state.step === "email"
                ? t("Login.emailStep")
                : t("Login.otpStep")}
          </p>
        </div>

        {!state.configured && (
          <div className="mt-6 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t("Login.configurationRequired")}
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>{t("Login.configurationMessage")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.step === "email" ? (
          <form
            className={`mt-8 space-y-6 ${!state.configured ? "opacity-50 pointer-events-none" : ""}`}
            onSubmit={handleEmailSubmit}
          >
            <div>
              <label htmlFor="email" className="sr-only">
                {t("Login.emailAddress")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm"
                placeholder={t("Login.emailAddress")}
                value={state.email}
                onChange={(e) => updateState({ email: e.target.value })}
                disabled={state.loading || !state.configured}
                tabIndex={!state.configured ? -1 : 0}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={state.loading || !state.email || !state.configured}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
                tabIndex={!state.configured ? -1 : 0}
              >
                {state.loading
                  ? tCommon("sending")
                  : t("Login.sendVerificationCode")}
              </button>
            </div>
          </form>
        ) : (
          <form
            className={`mt-8 space-y-6 ${!state.configured ? "opacity-50 pointer-events-none" : ""}`}
            onSubmit={handleOTPSubmit}
          >
            <div>
              <label htmlFor="otp" className="sr-only">
                {t("Login.verificationCode")}
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-accent-500 focus:border-accent-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={state.otp}
                onChange={(e) =>
                  updateState({ otp: e.target.value.replace(/\D/g, "") })
                }
                disabled={state.loading || !state.configured}
                tabIndex={!state.configured ? -1 : 0}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
                disabled={!state.configured}
                tabIndex={!state.configured ? -1 : 0}
              >
                {tCommon("back")}
              </button>
              <button
                type="submit"
                disabled={
                  state.loading || state.otp.length !== 6 || !state.configured
                }
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
                tabIndex={!state.configured ? -1 : 0}
              >
                {state.loading
                  ? tCommon("verifying")
                  : t("Login.verifyAndLogin")}
              </button>
            </div>
          </form>
        )}

        {state.error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-400">
              {state.error}
            </div>
          </div>
        )}

        {state.success && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm text-green-700 dark:text-green-400">
              {state.success}
            </div>
          </div>
        )}

        {state.step === "otp" && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("Login.sentTo")}{" "}
              <span className="font-medium">{state.email}</span>
            </p>
            <button
              type="button"
              onClick={handleBackToEmail}
              className="mt-2 text-sm text-accent-600 hover:text-accent-500"
            >
              {t("Login.useDifferentEmail")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
