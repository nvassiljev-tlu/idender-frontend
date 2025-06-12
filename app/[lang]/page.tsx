'use client';

import Link from 'next/link';
import Cookie from 'js-cookie';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import i18n from '../i18n/client';
export default function Home() {
  const params = useParams();
  const lang =
    typeof params.lang === 'string'
      ? params.lang
      : Array.isArray(params.lang)
      ? params.lang[0]
      : 'et';

  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);

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

  if (!ready) return <div>Loading...</div>; // prevent hydration mismatch

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/nonauthenticated/landing" className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition">
          {t('landing')}
        </Link>

        <Link href="/login" className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition">
          {t('login')}
        </Link>

        <Link href="/nonauthenticated/loginpage" className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition">
          {t('oldLogin')}
        </Link>

        <Link href="/signup" className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition">
          {t('signup')}
        </Link>

        <Link href="/authenticated/home" className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition">
          {t('home')}
        </Link>
      </div>
    </main>
  );
}
