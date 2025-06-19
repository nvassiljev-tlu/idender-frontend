'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookie from 'js-cookie';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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
  6: 'Declined (voting)'
};

const ALL_SCOPES = [
  { id: 1, name: 'auth:access' },
  { id: 2, name: 'auth:signup' },
  { id: 3, name: 'user:admin' }, // нельзя забрать обратно
  { id: 4, name: 'users:moderate' },
  { id: 5, name: 'users:scopes' },
  { id: 6, name: 'ideas:read' },
  { id: 7, name: 'ideas:create' },
  { id: 8, name: 'ideas:update' },
  { id: 9, name: 'ideas:moderate' },
  { id: 10, name: 'comments:read' },
  { id: 11, name: 'comments:create' },
  { id: 12, name: 'comments:moderate' },
  { id: 13, name: 'voting:read' },
  { id: 14, name: 'voting:vote' },
  { id: 15, name: 'user:superadmin' }, // Read only
];

// Helper to extract error message from API response
function extractErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null) {
    // Use Record<string, unknown> instead of any
    const d = data as Record<string, unknown>;
    if (
      typeof d.errors === 'object' &&
      d.errors !== null &&
      'message' in d.errors &&
      typeof (d.errors as Record<string, unknown>).message === 'string'
    ) {
      return (d.errors as Record<string, unknown>).message as string;
    }
    if (
      typeof d.payload === 'object' &&
      d.payload !== null &&
      'message' in d.payload &&
      typeof (d.payload as Record<string, unknown>).message === 'string'
    ) {
      return (d.payload as Record<string, unknown>).message as string;
    }
    if (
      typeof d.payload === 'object' &&
      d.payload !== null &&
      'error' in d.payload &&
      typeof (d.payload as Record<string, unknown>).error === 'string'
    ) {
      return (d.payload as Record<string, unknown>).error as string;
    }
    if ('message' in d && typeof d.message === 'string') {
      return d.message;
    }
  }
  return 'Unknown error';
}

export default function UserDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [scopes, setScopes] = useState<Array<{ id: number; name: string; assigned_by_other_admin?: boolean }>>([]);
  const [pendingScopes, setPendingScopes] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [editingField, setEditingField] = useState<null | 'first_name' | 'last_name'>(null);
  const [editValue, setEditValue] = useState('');
  const scopeMenuRef = useRef<HTMLDivElement>(null);
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
        setError(extractErrorMessage(userData));
      }

      if (ideasRes.ok && ideasData.status === 'OPERATION-OK') {
        setIdeas(ideasData.payload);
      } else {
        setError(prev =>
          (prev ? prev + ' ' : '') + extractErrorMessage(ideasData)
        );
      }
    } catch (e: unknown) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [router, userId]);

  const getScopes = useCallback(async () => {
    if (!user) return;
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}/scopes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const scopesData = await res.json();

      if (!res.ok) {
        setError(extractErrorMessage(scopesData));
        return;
      }

      setScopes(scopesData.payload);
      setPendingScopes(scopesData.payload.map((s: { id: number }) => s.id));
    } catch (e: unknown) {
      setError(extractErrorMessage(e));
    }
  }, [user]);

  const handleScopeChange = (scopeId: number, checked: boolean) => {
    if (
      scopeId === 3 && 
      !checked &&      
      scopes.some(s => s.id === 3 && s.assigned_by_other_admin)
    ) {
      setError('If admin has been assigned by other admin before, you cannot take his admin rights back.');
      return;
    }
    setPendingScopes((prev) =>
      checked ? [...prev, scopeId] : prev.filter((id) => id !== scopeId)
    );
  };

  const saveScopes = async () => {
    if (!user) return;
    try {
      const token = Cookie.get('sid');
      const res = await fetch(
        `https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}/scopes`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ scopes: pendingScopes }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(extractErrorMessage(data));
        return;
      }
      getScopes();
      setShowScopeMenu(false);
    } catch (e: unknown) {
      setError(extractErrorMessage(e));
    }
  };

  const handleEditClick = (field: 'first_name' | 'last_name') => {
    setEditingField(field);
    setEditValue(user ? user[field] : '');
  };

  const handleEditSave = async () => {
    if (!user || !editingField) return;
    try {
      const token = Cookie.get('sid');
      const res = await fetch(`https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ [editingField]: editValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.errors?.message || data?.error?.message || 'Failed to update name');
        return;
      }
      setUser(prev => prev ? { ...prev, [editingField]: editValue } : prev);
      setEditingField(null);
      setEditValue('');
    } catch (e) {
      console.error('Failed to update name:', e);
      setError('Failed to update name');
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    getScopes();
  }, [getScopes]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="h-8 w-8 animate-spin text-white">Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 pt-16 pb-8">
      <div className="w-full max-w-3xl mx-auto bg-white shadow rounded">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b p-6 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
          <Button
            variant="default"
            size="default"
            onClick={() => setShowScopeMenu((v) => !v)}
          >
            Show All Scopes
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Edit First Name */}
            {editingField === 'first_name' ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="border rounded px-2 py-1 text-black bg-white"
                  autoFocus
                />
                <Button size="sm" onClick={handleEditSave}>Save</Button>
                <Button size="sm" variant="secondary" onClick={handleEditCancel}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => handleEditClick('first_name')}>
                Edit First Name
              </Button>
            )}

            {/* Edit Last Name */}
            {editingField === 'last_name' ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="border rounded px-2 py-1 text-black bg-white"
                  autoFocus
                />
                <Button size="sm" onClick={handleEditSave}>Save</Button>
                <Button size="sm" variant="secondary" onClick={handleEditCancel}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => handleEditClick('last_name')}>
                Edit Last Name
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              {showScopeMenu && (
                <div
                  ref={scopeMenuRef}
                  className="absolute left-0 z-20 mt-2 bg-black border rounded shadow-lg p-4 w-72"
                >
                  <h3 className="font-semibold mb-2">User Scopes</h3>
                  <ul>
                    {ALL_SCOPES.map((scope) => {
                      const checked = pendingScopes.includes(scope.id);
                      return (
                        <li
                          key={scope.id}
                          className={`flex items-center py-1 ${
                            scope.id === 1 || scope.id === 2 || scope.id === 15 ? 'text-gray-400' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={scope.id === 15}
                            className="mr-2"
                            onChange={
                              scope.id === 1 || scope.id === 2 || scope.id === 15
                                ? undefined
                                : (e) => handleScopeChange(scope.id, e.target.checked)
                            }
                          />
                          <span className="whitespace-nowrap overflow-visible">{scope.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setShowScopeMenu(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveScopes}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
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

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-4 m-4 flex items-center justify-between">
              <div className="text-red-800 text-sm">{error}</div>
              <button
                className="ml-4 text-red-400 hover:text-red-700 text-xl font-bold"
                onClick={() => setError('')}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>
          )}

          <Button onClick={() => router.back()} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
