'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from '../../i18n/client';
import Cookie from "js-cookie";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const code = searchParams.get('code');
  const lang = searchParams.get('lang') || 'et';

  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const changeLang = async () => {
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
        Cookie.set('lang', lang);
      }
      setReady(true);
    };
    changeLang();
  }, [lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (!email || !code) {
      setError('Missing email or reset code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://37.27.182.28:3001/v1/oauth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error resetting password');
      }

      setSuccess(true);
      setTimeout(() => router.push(`/${lang}/login`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-green-600 mb-4">
            {t('passwordResetSuccess')}
          </h1>
          <p>{t('redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-slate-700 text-center mb-6">
          {t('resetPassword')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('newPassword')}
            className="h-auto w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
            required
            disabled={loading}
          />

          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('confirmPassword')}
            className="h-auto w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-500 transition duration-200 flex items-center justify-center"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            {t('resetPasswordButton')}
          </Button>
        </form>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push(`/${lang}/login`)}
            className="text-black hover:underline hover:text-black/70 text-sm font-medium transition"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
