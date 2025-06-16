'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';

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

const statusMap: Record<number, string> = {
  0: 'Created / Pending Moderation',
  1: 'On Voting',
  2: 'Pending School Administration Decision',
  3: 'Approved',
  4: 'Declined (by School)',
  5: 'Declined (Moderation)',
};

export default function AllIdeasAdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('et');
  const router = useRouter();

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`http://37.27.182.28:3001/v1/ideas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.status === 'OPERATION-OK') {
        setIdeas(data.payload);
      } else {
        setError('Failed to load ideas.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: number) => {
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/status`, {
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
        setError('Failed to update idea status.');
      }
    } catch {
      setError('Could not connect to server.');
    }
  };

  useEffect(() => {
    fetchIdeas();
    const language = Cookie.get('lang') || 'et';
    setLang(language);
  }, []);

  const filteredIdeas = ideas.filter((idea) => idea.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-500 text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-slate-600 p-6 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold mb-6">All Ideas (Admin View)</h1>

        {error && (
          <Alert className="border-red-500 bg-red-100 text-red-700">
            <XCircle className="h-5 w-5" />
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="sticky top-0 bg-slate-600 z-10">
          <label className="block mb-2">Status Filter:</label>
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
              <p className="text-center text-gray-400">No ideas with this status.</p>
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
                      Author:{' '}
                      {idea.is_anonymus === 1
                        ? 'Anonymous'
                        : `${idea.first_name ?? ''} ${idea.last_name ?? ''}`}
                    </p>
                    <p className="text-sm font-semibold line-clamp-1 text-ellipsis">
                      Status: {statusMap[idea.status]}
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
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChangeStatus(idea.id, 5);
                        }}
                      >
                        Decline
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