'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  // check if user is logged in
  useEffect(() => {
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
          setUserId(data.payload.user.id);
        } else {
          setError('You are not logged in.');
          setLoading(false);
        }
      } catch (err) {
        setError('Could not connect to server.');
        console.log(err)
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // load ideas if logged in
  useEffect(() => {
    if (!userId) return;

    const fetchIdeas = async () => {
      try {
        const res = await fetch(`http://37.27.182.28:3001/v1/users/${userId}/ideas`, {
          method: 'GET',
          credentials: 'include',
           headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookie.get('sid')}` 
          }
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
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId]);

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

        {loading && !error && (
          <p className="text-center text-sm text-white">Loading your ideas...</p>
        )}

        {!loading && ideas.length === 0 && !error && (
          <p className="text-center text-sm text-white">No ideas submitted yet.</p>
        )}


        {!loading && ideas.map((idea) => (
          <div key={idea.id} className="border border-slate-400 p-4 rounded bg-slate-700">
            <h2 className="text-lg font-semibold">{idea.title}</h2>
            <p className="text-sm text-slate-300 mb-2">{idea.description}</p>
            <p className={`text-sm font-semibold ${idea.status === 3 ? 'text-green-400' : idea.status === 4 || idea.status === 5 ? 'text-red-400' : 'text-yellow-400'}`}>
              Status: {statusMap[idea.status] || "Unknown"}
            </p>
          </div>
      ))}
      </div>
    </div>
  );
}
