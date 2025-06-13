'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from '../../i18n/client';
import Cookie from "js-cookie";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : 'et';

  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const res = await fetch('http://37.27.182.28:3001/v1/oauth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error sending reset link');
      }

      const data = await res.json();
      console.log('Server response:', data);

      // Попробуем найти код в нескольких полях
      const code = data.payload.code ;
      if (!code) {
        throw new Error('Reset code not received from server');
      }

      router.push(`/${lang}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&lang=${lang}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-slate-700 text-center mb-6">
          {t('forgotPassword')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            className="w-full p-2 border border-gray-300 rounded-md text-black bg-white"
            required
            disabled={loading}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-500 transition duration-200 flex items-center justify-center"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            {loading ? t('sending') : t('send reset link')}
          </Button>
        </form>

        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
}
