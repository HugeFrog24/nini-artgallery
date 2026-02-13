"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PersonalMessage } from "@/types/config";
import { ArtistProfileWithTranslations } from "@/types/admin";
import { PlusIcon, TrashIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import SettingsCard from "@/components/admin/SettingsCard";
import FormField from "@/components/admin/FormField";
import SaveButton from "@/components/admin/SaveButton";
import { getAdminLocales, getLocaleConfig } from "@/lib/locales";

interface AdminState {
  isAuthenticated: boolean;
  loading: boolean;
  personalMessage: PersonalMessage | null;
  artistProfile: ArtistProfileWithTranslations | null;
  saving: boolean;
  savingArtist: boolean;
  error: string;
  success: string;
  artistError: string;
  artistSuccess: string;
}

// Get available locales for translation (without flags)
const AVAILABLE_LOCALES = getAdminLocales();

export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    loading: true,
    personalMessage: null,
    artistProfile: null,
    saving: false,
    savingArtist: false,
    error: "",
    success: "",
    artistError: "",
    artistSuccess: "",
  });

  const updateState = (updates: Partial<AdminState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const loadPersonalMessage = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/personal-message");

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        updateState({
          isAuthenticated: true,
          personalMessage: data.data,
        });
      } else {
        updateState({
          error: data.message,
        });
      }
    } catch {
      updateState({
        error: t("Errors.failedToLoadSettings"),
      });
    }
  }, [router, t]);

  const loadArtistProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/artist");

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (data.success) {
        updateState({
          artistProfile: {
            name: data.data.name,
            description: data.data.description,
            defaultLanguage: data.data.defaultLanguage || "en",
            translations: data.data.translations || {},
          },
        });
      } else {
        updateState({
          artistError: data.message,
        });
      }
    } catch {
      updateState({
        artistError: t("Errors.failedToLoadSettings"),
      });
    }
  }, [router, t]);

  const loadAllSettings = useCallback(async () => {
    updateState({ loading: true });
    await Promise.all([loadPersonalMessage(), loadArtistProfile()]);
    updateState({ loading: false });
  }, [loadPersonalMessage, loadArtistProfile]);

  // Check authentication and load data
  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.personalMessage) return;

    updateState({ saving: true, error: "", success: "" });

    try {
      const response = await fetch("/api/admin/settings/personal-message", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.personalMessage),
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          saving: false,
          success: t("Settings.settingsSaved"),
          personalMessage: data.data,
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          updateState({ success: "" });
        }, 3000);
      } else {
        updateState({
          saving: false,
          error: data.message,
        });
      }
    } catch {
      updateState({
        saving: false,
        error: t("Errors.failedToSaveSettings"),
      });
    }
  };

  const updatePersonalMessage = (updates: Partial<PersonalMessage>) => {
    if (!state.personalMessage) return;

    updateState({
      personalMessage: { ...state.personalMessage, ...updates },
    });
  };

  const updateArtistProfile = (
    updates: Partial<ArtistProfileWithTranslations>,
  ) => {
    if (!state.artistProfile) return;

    updateState({
      artistProfile: { ...state.artistProfile, ...updates },
    });
  };

  const updateArtistTranslation = (
    locale: string,
    field: "name" | "description",
    value: string,
  ) => {
    if (!state.artistProfile) return;

    const updatedTranslations = {
      ...state.artistProfile.translations,
      [locale]: {
        ...state.artistProfile.translations[locale],
        [field]: value,
      },
    };

    updateArtistProfile({ translations: updatedTranslations });
  };

  const addTranslation = (locale: string) => {
    if (!state.artistProfile || state.artistProfile.translations[locale])
      return;

    const updatedTranslations = {
      ...state.artistProfile.translations,
      [locale]: {
        name: "",
        description: "",
      },
    };

    updateArtistProfile({ translations: updatedTranslations });
  };

  const removeTranslation = (locale: string) => {
    if (!state.artistProfile || !state.artistProfile.translations[locale])
      return;

    const updatedTranslations = { ...state.artistProfile.translations };
    delete updatedTranslations[locale];

    updateArtistProfile({ translations: updatedTranslations });
  };

  const getAvailableLocalesForAdd = () => {
    if (!state.artistProfile) return AVAILABLE_LOCALES;

    return AVAILABLE_LOCALES.filter(
      (locale) =>
        locale.code !== state.artistProfile!.defaultLanguage &&
        !state.artistProfile!.translations[locale.code],
    );
  };

  const handleArtistSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.artistProfile) return;

    updateState({ savingArtist: true, artistError: "", artistSuccess: "" });

    try {
      const payload = {
        name: state.artistProfile.name,
        description: state.artistProfile.description,
        translations: state.artistProfile.translations,
      };

      const response = await fetch("/api/admin/settings/artist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          savingArtist: false,
          artistSuccess: t("Settings.settingsSaved"),
          artistProfile: {
            ...state.artistProfile,
            name: data.data.name,
            description: data.data.description,
            translations:
              data.data.translations || state.artistProfile.translations,
          },
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          updateState({ artistSuccess: "" });
        }, 3000);
      } else {
        updateState({
          savingArtist: false,
          artistError: data.message,
        });
      }
    } catch {
      updateState({
        savingArtist: false,
        artistError: t("Errors.failedToSaveSettings"),
      });
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {tCommon("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t("Dashboard.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t("Dashboard.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Artist Profile Settings */}
          <SettingsCard
            title={t("ArtistSettings.title")}
            description={t("ArtistSettings.description")}
            error={state.artistError}
            success={state.artistSuccess}
          >
            {state.artistProfile && (
              <form onSubmit={handleArtistSave} className="mt-6 space-y-8">
                {/* Primary Language Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-4">
                    <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      Primary Language (
                      {state.artistProfile.defaultLanguage.toUpperCase()})
                    </h4>
                  </div>

                  <div className="space-y-4">
                    {/* Primary Artist Name */}
                    <FormField
                      label={t("ArtistSettings.artistName")}
                      htmlFor="artistName"
                      characterCount={{
                        current: state.artistProfile.name.length,
                        max: 100,
                      }}
                    >
                      <input
                        type="text"
                        id="artistName"
                        value={state.artistProfile.name}
                        onChange={(e) =>
                          updateArtistProfile({ name: e.target.value })
                        }
                        maxLength={100}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        placeholder={t("ArtistSettings.enterArtistName")}
                      />
                    </FormField>

                    {/* Primary Artist Description */}
                    <FormField
                      label={t("ArtistSettings.artistDescription")}
                      htmlFor="artistDescription"
                      characterCount={{
                        current: state.artistProfile.description.length,
                        max: 1000,
                      }}
                    >
                      <textarea
                        id="artistDescription"
                        rows={6}
                        value={state.artistProfile.description}
                        onChange={(e) =>
                          updateArtistProfile({ description: e.target.value })
                        }
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                        placeholder={t("ArtistSettings.enterArtistDescription")}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Translations Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Translations
                    </h4>
                    {getAvailableLocalesForAdd().length > 0 && (
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addTranslation(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        >
                          <option value="">Add Translation...</option>
                          {getAvailableLocalesForAdd().map((locale) => (
                            <option key={locale.code} value={locale.code}>
                              {locale.name} ({locale.code})
                            </option>
                          ))}
                        </select>
                        <PlusIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Translation Cards */}
                  <div className="space-y-4">
                    {Object.entries(state.artistProfile.translations).map(
                      ([locale, translation]) => {
                        const localeInfo = getLocaleConfig(locale);
                        return (
                          <div
                            key={locale}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {localeInfo?.name || locale} (
                                {locale.toUpperCase()})
                              </h5>
                              <button
                                type="button"
                                onClick={() => removeTranslation(locale)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                aria-label={`Remove ${locale} translation`}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {/* Translation Name */}
                              <FormField
                                label={`Artist Name (${locale})`}
                                htmlFor={`name-${locale}`}
                                characterCount={{
                                  current: translation.name.length,
                                  max: 100,
                                }}
                              >
                                <input
                                  type="text"
                                  id={`name-${locale}`}
                                  value={translation.name}
                                  onChange={(e) =>
                                    updateArtistTranslation(
                                      locale,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  maxLength={100}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                                  placeholder={`Enter artist name in ${localeInfo?.name || locale}`}
                                />
                              </FormField>

                              {/* Translation Description */}
                              <FormField
                                label={`Artist Description (${locale})`}
                                htmlFor={`description-${locale}`}
                                characterCount={{
                                  current: translation.description.length,
                                  max: 1000,
                                }}
                              >
                                <textarea
                                  id={`description-${locale}`}
                                  rows={4}
                                  value={translation.description}
                                  onChange={(e) =>
                                    updateArtistTranslation(
                                      locale,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  maxLength={1000}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                                  placeholder={`Enter artist description in ${localeInfo?.name || locale}`}
                                />
                              </FormField>
                            </div>
                          </div>
                        );
                      },
                    )}

                    {Object.keys(state.artistProfile.translations).length ===
                      0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No translations added yet.</p>
                        <p className="text-sm">
                          Use the dropdown above to add translations in other
                          languages.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <SaveButton
                  isLoading={state.savingArtist}
                  loadingText={tCommon("saving")}
                  saveText={t("Settings.saveChanges")}
                />
              </form>
            )}
          </SettingsCard>

          {/* Broadcast Message Settings */}
          <div className="mt-8">
            <SettingsCard
              title={t("Settings.broadcastMessageSettings")}
              description={t("Settings.broadcastMessageDescription")}
              error={state.error}
              success={state.success}
            >
              {state.personalMessage && (
                <form onSubmit={handleSave} className="mt-6 space-y-6">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center">
                    <input
                      id="enabled"
                      name="enabled"
                      type="checkbox"
                      checked={state.personalMessage.enabled}
                      onChange={(e) =>
                        updatePersonalMessage({ enabled: e.target.checked })
                      }
                      className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 rounded accent-accent-600"
                    />
                    <label
                      htmlFor="enabled"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      {t("Settings.displayBroadcastMessage")}
                    </label>
                  </div>

                  {/* Recipient */}
                  <FormField
                    label={t("Settings.title")}
                    htmlFor="recipient"
                    characterCount={{
                      current: state.personalMessage.recipient.length,
                      max: 100,
                    }}
                  >
                    <input
                      type="text"
                      id="recipient"
                      value={state.personalMessage.recipient}
                      onChange={(e) =>
                        updatePersonalMessage({ recipient: e.target.value })
                      }
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder={t("Settings.enterMessageTitle")}
                    />
                  </FormField>

                  {/* Message */}
                  <FormField
                    label={t("Settings.messageContent")}
                    htmlFor="message"
                    characterCount={{
                      current: state.personalMessage.message.length,
                      max: 2000,
                    }}
                  >
                    <textarea
                      id="message"
                      rows={6}
                      value={state.personalMessage.message}
                      onChange={(e) =>
                        updatePersonalMessage({ message: e.target.value })
                      }
                      maxLength={2000}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                      placeholder={t("Settings.enterMessageContent")}
                    />
                  </FormField>

                  {/* Dismissible Toggle */}
                  <div className="flex items-center">
                    <input
                      id="dismissible"
                      name="dismissible"
                      type="checkbox"
                      checked={state.personalMessage.dismissible}
                      onChange={(e) =>
                        updatePersonalMessage({ dismissible: e.target.checked })
                      }
                      className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 rounded accent-accent-600"
                    />
                    <label
                      htmlFor="dismissible"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      {t("Settings.allowDismiss")}
                    </label>
                  </div>

                  <SaveButton
                    isLoading={state.saving}
                    loadingText={tCommon("saving")}
                    saveText={t("Settings.saveChanges")}
                  />
                </form>
              )}
            </SettingsCard>
          </div>
        </div>
      </main>
    </div>
  );
}
