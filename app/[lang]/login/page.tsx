'use client';

import { LoginForm } from "@/components/login-form";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import { useTranslation } from "react-i18next";
import i18n from '../../i18n/client';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : 'et';

  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Change language and wait before rendering
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
        const res = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookie.get('sid')}`
          }
        });

        const data = await res.json();
        if (res.status === 200 && data.payload?.user?.id) {
          router.push('/authenticated/home');
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(t('errorConnection'));
        setLoading(false);
      }
    };
    checkLogin();
  }, [lang, router]);

  if (!ready || loading) return <p className="text-center mt-4">{t('loading')}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-slate-700 text-center">
          {t('loginTitle')}
        </h1>
        <LoginForm />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
}
