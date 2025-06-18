'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';
import Cookie from 'js-cookie';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n/client';

type Idea = {
  id: string;
  title: string;
  description: string;
  status: number;
  is_anonymus?: number;
  createdAt?: string;
};

export default function MyIdeasPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [lang, setLang] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);

  const statusMap: { [key: number]: string } = {
    0: t("status1.created"),
    1: t("status1.voting"),
    2: t("status1.pending_admin"),
    3: t("status1.approved"),
    4: t("status1.declined_school"),
    5: t("status1.declined_moderation"),
  };

  useEffect(() => {
    const language = Cookie.get("lang") || "et";
    setLang(language);
    const changeLang = async () => {
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }
    };
    changeLang();

    const checkLogin = async () => {
      try {
        const token = Cookie.get('sid');
        if (!token) {
          setError(t('error.login'));
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.status === 200 && data.payload?.user?.id) {
          setUserId(data.payload.user.id);
        } else {
          Cookie.remove('sid');
          setError(t('error.login'));
        }
      } catch (err) {
        console.log('Login check error:', err);
        setError(t('error.server'));
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, [t]);

  useEffect(() => {
    if (!userId) return;

    const fetchIdeas = async () => {
      setIsFetchingIdeas(true);
      try {
        const token = Cookie.get('sid');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${userId}/ideas`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.status === 200 && data.status === 'OPERATION-OK') {
          setIdeas(data.payload);
        } else {
          setError(t('error.loadIdeas'));
        }
      } catch (err) {
        console.log('Fetch ideas error:', err);
        setError(t('error.server'));
      } finally {
        setIsFetchingIdeas(false);
      }
    };

    fetchIdeas();
  }, [userId, t]);

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/${lang}/a/ideas/${ideaId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-500 text-white font-sans px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("myIdeas.title")}</h1>

      <div className="w-full max-w-2xl bg-slate-600 p-6 rounded-lg shadow space-y-4">
        {error && (
          <Alert className="border-red-500 bg-red-100 text-red-700">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <AlertTitle>{t("error.title")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {isFetchingIdeas && !error && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-sm text-white ml-2">{t("loading.ideas")}</p>
          </div>
        )}

        {!isFetchingIdeas && ideas.length === 0 && !error && (
          <p className="text-center text-sm text-white">{t("noIdeas")}</p>
        )}

        {!isLoading && ideas.map((idea) => (
          <div 
            key={idea.id} 
            onClick={() => handleIdeaClick(idea.id)}
            className="border border-slate-400 p-4 rounded bg-slate-700 cursor-pointer hover:bg-slate-600 transition-colors">
            <h2 className="text-lg font-semibold">{idea.title}</h2>
            <p className="text-sm text-slate-300 mb-2">{idea.description}</p>
            <p className="text-sm font-semibold">
              {t("status.label")}: {statusMap[idea.status] || 'Unknown'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}