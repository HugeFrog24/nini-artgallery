'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PersonalMessage } from '@/types/config';

interface AdminState {
  isAuthenticated: boolean;
  loading: boolean;
  personalMessage: PersonalMessage | null;
  saving: boolean;
  error: string;
  success: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const t = useTranslations('admin');
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    loading: true,
    personalMessage: null,
    saving: false,
    error: '',
    success: ''
  });

  const updateState = (updates: Partial<AdminState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadPersonalMessage = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings/personal-message');
      
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        updateState({
          isAuthenticated: true,
          loading: false,
          personalMessage: data.data
        });
      } else {
        updateState({
          loading: false,
          error: data.message
        });
      }
    } catch {
      updateState({
        loading: false,
        error: t('Errors.failedToLoadSettings')
      });
    }
  }, [router]);

  // Check authentication and load data
  useEffect(() => {
    loadPersonalMessage();
  }, [loadPersonalMessage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.personalMessage) return;

    updateState({ saving: true, error: '', success: '' });

    try {
      const response = await fetch('/api/admin/settings/personal-message', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.personalMessage)
      });

      const data = await response.json();

      if (data.success) {
        updateState({
          saving: false,
          success: t('Settings.settingsSaved'),
          personalMessage: data.data
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          updateState({ success: '' });
        }, 3000);
      } else {
        updateState({
          saving: false,
          error: data.message
        });
      }
    } catch {
      updateState({
        saving: false,
        error: t('Errors.failedToSaveSettings')
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  const updatePersonalMessage = (updates: Partial<PersonalMessage>) => {
    if (!state.personalMessage) return;
    
    updateState({
      personalMessage: { ...state.personalMessage, ...updates }
    });
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('Dashboard.loading')}</p>
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('Dashboard.title')}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('Dashboard.subtitle')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('Dashboard.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {t('Settings.broadcastMessageSettings')}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('Settings.broadcastMessageDescription')}
              </p>

              {state.error && (
                <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {state.error}
                  </div>
                </div>
              )}

              {state.success && (
                <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="text-sm text-green-700 dark:text-green-400">
                    {state.success}
                  </div>
                </div>
              )}

              {state.personalMessage && (
                <form onSubmit={handleSave} className="mt-6 space-y-6">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center">
                    <input
                      id="enabled"
                      name="enabled"
                      type="checkbox"
                      checked={state.personalMessage.enabled}
                      onChange={(e) => updatePersonalMessage({ enabled: e.target.checked })}
                      className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 rounded accent-accent-600"
                    />
                    <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      {t('Settings.displayBroadcastMessage')}
                    </label>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Settings.title')}
                    </label>
                    <input
                      type="text"
                      id="recipient"
                      value={state.personalMessage.recipient}
                      onChange={(e) => updatePersonalMessage({ recipient: e.target.value })}
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder={t('Settings.enterMessageTitle')}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('Settings.charactersCount', { count: state.personalMessage.recipient.length, max: 100 })}
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Settings.messageContent')}
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      value={state.personalMessage.message}
                      onChange={(e) => updatePersonalMessage({ message: e.target.value })}
                      maxLength={2000}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                      placeholder={t('Settings.enterMessageContent')}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('Settings.charactersCount', { count: state.personalMessage.message.length, max: 2000 })}
                    </p>
                  </div>

                  {/* Dismissible Toggle */}
                  <div className="flex items-center">
                    <input
                      id="dismissible"
                      name="dismissible"
                      type="checkbox"
                      checked={state.personalMessage.dismissible}
                      onChange={(e) => updatePersonalMessage({ dismissible: e.target.checked })}
                      className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 dark:border-gray-600 rounded accent-accent-600"
                    />
                    <label htmlFor="dismissible" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      {t('Settings.allowDismiss')}
                    </label>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={state.saving}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {state.saving ? t('Settings.saving') : t('Settings.saveChanges')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}