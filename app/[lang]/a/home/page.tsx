'use client';

import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/client';

function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

const formatDate = (timestamp: string | number) => {
  const date = new Date(Number(timestamp));
  return new Intl.DateTimeFormat('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export default function IdenderDashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState('');
  const [news, setNews] = useState<Array<{ id: number; title: string; description: string; created_at: string }>>([]);

  useClickOutside(profileMenuRef, () => {});

  useEffect(() => {
    const language = Cookie.get('lang') || 'et';
    const changeLang = async () => {
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }
    };
    changeLang();
    setLang(language);
  }, []);

  const fetchNews = useCallback(async () => {
  try {
    const token = Cookie.get('sid');
    const res = await fetch('https://api-staging.idender.services.nvassiljev.com/v1/news/recent', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setNews(data.payload);
    } else {
      setError(t('fetchError'));
    }
  } catch (err) {
    console.error(err);
    setError(t('fetchError'));
  }
}, [t]);

useEffect(() => {
  const token = Cookie.get('sid');
  if (!token) {
    router.push('/login');
    return;
  }

  const checkLogin = async () => {
    try {
      const res = await fetch('https://api-staging.idender.services.nvassiljev.com/v1/oauth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 200) {
        Cookie.remove('sid');
        router.push('/login');
        return;
      }

      await fetchNews();
    } catch (err) {
      console.error(err);
      Cookie.remove('sid');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  checkLogin();
}, [router, fetchNews]);

  const handleCreateIdea = () => {
    router.push(`/${lang}/a/new-idea`);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 flex flex-col min-w-[320px]">
      <main className="w-full max-w-6xl mx-auto p-4 flex-1 overflow-y-auto min-w-[320px]">
        <section className="mb-20 w-full max-w-5xl min-w-[320px] sm:min-w-[600px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-slate-800">{t('newsTitle')}</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 w-full">{error}</div>
          )}

          {news.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 w-full min-w-[320px]">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center min-h-[150px] flex flex-col justify-center items-center">
                <p className="text-slate-500 mb-2">{t('noNews')}</p>
                <button onClick={fetchNews} className="text-blue-600 hover:text-blue-800 text-sm">{t('refresh')}</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 w-full">
              {news.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-base text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)}</p>
                  {item.description && <p className="mt-2 text-xs text-slate-600">{item.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
        <div className="flex gap-4 md:gap-8 w-full max-w-md">
          <button onClick={handleCreateIdea} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors">
            <span>{t('createIdea')}</span>
          </button>
          <button onClick={() => router.push(`/${lang}/a/voting`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-600 transition-colors">
            <span>{t('voting')}</span>
          </button>
        </div>
      </div>

      <div className="h-20 sm:hidden"></div>
    </div>
  );
}
