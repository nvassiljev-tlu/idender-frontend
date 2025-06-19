'use client';

import { LoginForm } from "@/components/login-form";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import { useTranslation } from "react-i18next";
import i18n from '../../i18n/client';
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : 'et';

  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const changeLang = async () => {
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
        Cookie.set('lang', lang);
      }
      setReady(true);
    };
    changeLang();

    const checkLogin = async () => {
      try {
        const res = await fetch('https://api-staging.idender.services.nvassiljev.com/v1/oauth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookie.get('sid')}`
          }
        });

        const data = await res.json();
        if (res.status === 200 && data.payload?.user?.id) {
          router.push(`/${lang}/a/home`);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Login check error:', err);
        setError(t('errorConnection'));
        setLoading(false);
      }
    };
    checkLogin();
  }, [lang, router, t]);

  if (!ready || loading) {
    return (
      <div className="fixed inset-0 bg-slate-500 bg-opacity-80 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
<div className="min-h-screen flex items-center justify-center">
  <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
    <h1 className="text-4xl sm:text-6xl md:text-5xl text-center font-bold bg-gradient-to-r from-blue-800 via-gray-300 to-red-700 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
      {t('appTitle')}
    </h1>
        <LoginForm />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
}
