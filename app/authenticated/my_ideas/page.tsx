'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Cookie from 'js-cookie';

type Idea = {
  id: string;
  title: string;
  description: string;
  status: 'accepted' | 'declined';
};

export default function MyIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = Cookie.get('sid');
        if (!token) {
          setError('You are not logged in.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
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
          setError('You are not logged in.');
        }
      } catch (err) {
        setError('Could not connect to server.');
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, []);

  // Load ideas if logged in
  useEffect(() => {
    if (!userId) return;

    const fetchIdeas = async () => {
      setIsFetchingIdeas(true);
      try {
        const token = Cookie.get('sid');
        const res = await fetch(`http://37.27.182.28:3001/v1/users/${userId}/ideas`, {
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
          setError('Failed to load ideas.');
        }
      } catch (err) {
        setError('Server connection failed.');
      } finally {
        setIsFetchingIdeas(false);
      }
    };

    fetchIdeas();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-500 text-white font-sans px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Ideas</h1>

      <div className="w-full max-w-2xl bg-slate-600 p-6 rounded-lg shadow space-y-4">
        {error && (
          <Alert className="border-red-500 bg-red-100 text-red-700">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {isFetchingIdeas && !error && (
          <p className="text-center text-sm text-white">Loading your ideas...</p>
        )}

        {!isFetchingIdeas && ideas.length === 0 && !error && (
          <p className="text-center text-sm text-white">No ideas submitted yet.</p>
        )}

        {!isFetchingIdeas &&
          ideas.map((idea) => (
            <div key={idea.id} className="border border-slate-400 p-4 rounded bg-slate-700">
              <h2 className="text-lg font-semibold">{idea.title}</h2>
              <p className="text-sm text-slate-300 mb-2">{idea.description}</p>
              <p className={`text-sm font-semibold ${idea.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                Status: {idea.status === 'accepted' ? '✅ Accepted' : '❌ Declined'}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}