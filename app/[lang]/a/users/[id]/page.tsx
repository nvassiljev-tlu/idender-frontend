'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookie from 'js-cookie';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, XCircle } from 'lucide-react';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  lang: string;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
};

type Idea = {
  id: string;
  title: string;
  description: string;
  status: number;
  is_anonymus?: number;
  createdAt?: string;
};

const statusMap: Record<number, string> = {
  0: 'Created / Pending Moderation',
  1: 'On Voting',
  2: 'Pending School Administration Decision',
  3: 'Approved',
  4: 'Declined (by School)',
  5: 'Declined (Moderation)',
};

export default function UserDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const userId = pathname.split('/').pop();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = Cookie.get('sid');
      if (!token) {
        router.push('/login');
        return;
      }

      if (!userId) {
        setError('User ID is missing.');
        setLoading(false);
        return;
      }

      const [userRes, ideasRes] = await Promise.all([
        fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
        fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${userId}/ideas`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
      ]);

      const userData = await userRes.json();
      const ideasData = await ideasRes.json();

      if (userRes.ok && userData.status === 'OPERATION-OK') {
        const u = userData.payload;
        setUser({
          id: u.id,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          lang: u.lang || 'et',
          avatar_url: u.profile_picture || '',
          is_active: u.is_active !== undefined ? u.is_active : true,
          is_admin: u.is_admin || false,
        });
      } else {
        setError('Failed to load user data.');
      }

      if (ideasRes.ok && ideasData.status === 'OPERATION-OK') {
        setIdeas(ideasData.payload);
      } else {
        setError(prev => prev + ' Failed to load user ideas.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }, [router, userId]);

  const updateName = async (field: 'first_name' | 'last_name', value: string) => {
    if (!user) return;
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update name');
      }

      setUser(prev => prev ? { ...prev, [field]: value } : prev);
    } catch (e) {
      console.error(e);
      setError(`Failed to update ${field === 'first_name' ? 'First Name' : 'Last Name'}.`);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to remove avatar');

      setUser(prev => prev ? { ...prev, avatar_url: '' } : prev);
    } catch {
      setError('Failed to remove avatar.');
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-100 text-red-700 m-4">
        <XCircle className="h-5 w-5 mr-2" />
        <div>
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </div>
      </Alert>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 pt-16 pb-8">
      <div className="w-full max-w-3xl mx-auto bg-white shadow rounded">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b p-6 flex items-center gap-4 mb-6">
          <Avatar>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-blue-900">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-blue-800">Email: {user.email}</p>
            <p className="text-sm text-blue-800">Status: {user.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={() => {
                const name = prompt('Enter new first name:', user.first_name);
                if (name) updateName('first_name', name);
              }}
            >
              Edit First Name
            </Button>
            <Button
              onClick={() => {
                const lastName = prompt('Enter new last name:', user.last_name);
                if (lastName) updateName('last_name', lastName);
              }}
            >
              Edit Last Name
            </Button>
            <Button variant="destructive" onClick={removeAvatar}>
              Remove Avatar
            </Button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-4">User&rsquo;s Ideas</h2>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {ideas.length === 0 ? (
                <p className="text-sm text-slate-600">This user has not submitted any ideas yet.</p>
              ) : (
                <ul className="space-y-4">
                  {ideas.map((idea) => (
                    <li key={idea.id} className="border p-4 rounded bg-slate-50">
                      <h3 className="text-lg font-medium text-black">{idea.title}</h3>
                      <p className="text-sm text-slate-700 mt-1">{idea.description}</p>
                      <p className="text-xs text-blue-800 mt-2">
                        Status: {statusMap[idea.status] || 'Unknown'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Button onClick={() => router.back()} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
