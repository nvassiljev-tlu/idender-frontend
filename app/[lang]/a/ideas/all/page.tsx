'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import i18n from '../../../../i18n/client';

type Idea = {
  id: string;
  title: string;
  description: string;
  status: number;
  createdAt?: string;
  first_name?: string;
  last_name?: string;
  is_anonymus?: number;
};

export default function AllIdeasAdminPage() {
  const { t } = useTranslation('common');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('et');
  const [i18nReady, setI18nReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const language = Cookie.get('lang') || 'et';
    setLang(language);

    const initLang = async () => {
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }
      setI18nReady(true);
    };

    initLang();
  }, []);

  useEffect(() => {
    if (!i18nReady) return;

    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const token = Cookie.get('sid');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/ideas`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.status === 'OPERATION-OK') {
          setIdeas(data.payload);
        } else {
          setError(t('error.loadIdeas'));
        }
      } catch {
        setError(t('error.connectServer'));
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [i18nReady, t]);

  const statusMap = useMemo<Record<number, string>>(() => ({
    0: t('status3.created'),
    1: t('status3.voting'),
    2: t('status3.pending_admin'),
    3: t('status3.approved'),
    4: t('status3.declined_school'),
    5: t('status3.declined_moderation'),
  }), [t]);


  const handleChangeStatus = async (id: string, newStatus: number) => {
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/ideas/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === id ? { ...idea, status: newStatus } : idea
          )
        );
      } else {
        setError(t('error.updateStatus'));
      }
    } catch {
      setError(t('error.connectServer'));
    }
  };

  const filteredIdeas = ideas.filter((idea) => idea.status === statusFilter);

  if (!i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-500 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-slate-600 p-6 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold mb-6">{t('allIdeas.title')}</h1>

        {error && (
          <Alert className="border-red-500 bg-red-100 text-red-700">
            <XCircle className="h-5 w-5" />
            <div>
              <AlertTitle>{t('error.title')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="sticky top-0 bg-slate-600 z-10">
          <label className="block mb-2">{t('filterByStatus')}</label>
          <select
            className="p-2 rounded bg-slate-700 text-white w-full max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(Number(e.target.value))}
          >
            {Object.entries(statusMap).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredIdeas.length === 0 ? (
              <p className="text-center text-gray-400">{t('noIdeas1')}</p>
            ) : (
              filteredIdeas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => router.push(`/${lang}/a/ideas/${idea.id}`)}
                  className="border border-slate-400 p-4 rounded bg-slate-700 cursor-pointer hover:bg-slate-600 transition-colors w-full box-border"
                >
                  <div className="break-words overflow-hidden">
                    <h2 className="text-lg font-semibold line-clamp-2 text-ellipsis">
                      {idea.title}
                    </h2>
                    <p className="text-sm text-slate-300 line-clamp-3 text-ellipsis mb-2">
                      {idea.description}
                    </p>
                    <p className="text-sm text-slate-400 line-clamp-1 text-ellipsis">
                      {t('submittedBy')}: {idea.is_anonymus === 1 ? 'Anonymous' : `${idea.first_name ?? ''} ${idea.last_name ?? ''}`}
                    </p>
                    <p className="text-sm font-semibold line-clamp-1 text-ellipsis">
                      {t('status.label')}: {statusMap[idea.status]}
                    </p>
                  </div>

                  {idea.status === 0 && (
                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(idea.id, 1);
                        }}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(idea.id, 5);
                        }}
                      >
                        {t('decline')}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
