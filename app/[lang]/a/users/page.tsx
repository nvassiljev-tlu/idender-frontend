'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MoreVertical, XCircle } from 'lucide-react';

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  lang: string;
  avatar_url?: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin?: boolean;
};

type RawUser = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  lang?: string;
  profile_picture?: string;
  is_active?: boolean;
  is_admin?: boolean;
  is_superadmin?: boolean;
};

export default function AllUsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUserId = Cookie.get('uid');

  const [transferAdminOpenFor, setTransferAdminOpenFor] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferError, setTransferError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = Cookie.get('sid');
      if (!token) return router.push('/login');

      const [usersRes, currentUserRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
      ]);

      const usersData: { payload: RawUser[]; status: string } = await usersRes.json();
      const currentUserData: { payload: { user: RawUser }; status: string } = await currentUserRes.json();

      if (
        usersRes.ok &&
        usersData.status === 'OPERATION-OK' &&
        currentUserRes.ok &&
        currentUserData.status === 'OPERATION-OK'
      ) {
        const userList: User[] = usersData.payload.map((user) => ({
          id: user.id,
          first_name: user.first_name ?? '',
          last_name: user.last_name ?? '',
          email: user.email ?? '',
          lang: user.lang ?? 'et',
          avatar_url: user.profile_picture ?? '',
          is_active: user.is_active ?? true,
          is_admin: user.is_admin ?? false,
          is_superadmin: user.is_superadmin ?? false,
        }));

        const u = currentUserData.payload.user;
        const current: User = {
          id: u.id,
          first_name: u.first_name ?? '',
          last_name: u.last_name ?? '',
          email: u.email ?? '',
          lang: u.lang ?? 'et',
          avatar_url: u.profile_picture ?? '',
          is_active: u.is_active ?? true,
          is_admin: u.is_admin ?? false,
          is_superadmin: u.is_superadmin ?? false,
        };

        setCurrentUser(current);
        setUsers([current, ...userList.filter((u) => u.id !== current.id)]);
      } else {
        setError('Failed to fetch users or current user.');
      }
    } catch {
      setError('Server error.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const updateUserStatus = async (id: string, activate: boolean) => {
    setError('');
    try {
      const token = Cookie.get('sid');
      const endpoint = activate ? 'activate' : 'deactivate';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'OPERATION-OK') {
        throw new Error(data.error?.message || `Failed to ${activate ? 'activate' : 'deactivate'} user.`);
      }

      updateUser(id, { is_active: activate });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message || `Failed to ${activate ? 'activate' : 'deactivate'} user.`);
    }
  };

  const updateUser = (id: string, changes: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...changes } : user))
    );
    if (id === currentUserId && currentUser) {
      setCurrentUser({ ...currentUser, ...changes });
    }
  };

  const assignRole = async (id: string, role: 'user' | 'admin' | 'superadmin') => {
    setError('');
    try {
      const token = Cookie.get('sid');
      let scopeIds: number[] = [];

      if (role === 'user') scopeIds = [1];
      else if (role === 'admin') scopeIds = [1, 3];
      else if (role === 'superadmin') scopeIds = [1, 3, 15];

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/${id}/scopes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ scopeIds }),
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'OPERATION-OK') {
        throw new Error(data.error?.message || 'Failed to assign role.');
      }

      updateUser(id, {
        is_admin: role === 'admin' || role === 'superadmin',
        is_superadmin: role === 'superadmin',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      throw err;
    }
  };

  const checkAdminCount = () => {
    return users.filter((u) => u.is_admin && u.is_active).length;
  };

  const canRemoveAdmin = (user: User) => {
    if (!currentUser) return false;
    if (!user.is_admin) return false;

    if (user.id === currentUser.id) {
      // Админ может снять права у себя, кроме супер-админа
      return !currentUser.is_superadmin;
    }

    // Только супер-админ может снимать права у других админов
    return currentUser.is_superadmin === true;
  };

  const handleTransferAdminSubmit = async (fromUserId: string) => {
    setTransferError('');
    if (!transferEmail.trim()) {
      setTransferError('Email is required');
      return;
    }

    const target = users.find(
      (u) => u.email.toLowerCase() === transferEmail.toLowerCase() && u.is_active
    );
    if (!target) {
      setTransferError('No active user found with that email');
      return;
    }
    if (target.is_superadmin) {
      setTransferError('User is already superadmin');
      return;
    }

    try {
      await assignRole(target.id, 'superadmin');
      await assignRole(fromUserId, 'admin');
      setTransferAdminOpenFor(null);
      setTransferEmail('');
      setError('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setTransferError(message || 'Transfer failed');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 pt-16 pb-8">
      <div className="w-full max-w-3xl mx-auto bg-white shadow rounded">
        <div className="sticky top-0 z-10 bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-blue-900">User Management</h1>
        </div>
        <div className="p-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {error && (
            <Alert className="bg-red-100 text-red-700 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <div>
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between border p-4 rounded bg-slate-50 hover:bg-slate-100"
            >
              <div
                onClick={() => router.push(`/${user.lang || 'et'}/a/users/${user.id}`)}
                className="flex items-center gap-4 cursor-pointer"
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-blue-900">
                    {user.first_name?.[0] ?? ''}
                    {user.last_name?.[0] ?? ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-black">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-blue-800">
                    Status: {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-blue-800">
                    Role:{' '}
                    {user.is_superadmin
                      ? 'Superadmin'
                      : user.is_admin
                      ? 'Admin'
                      : 'User'}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="text-blue-900" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {/* Блокировка/разблокировка */}
                  {user.id !== currentUserId && (
                    (!user.is_admin || currentUser?.is_superadmin) && (
                      <DropdownMenuItem
                        onClick={() => updateUserStatus(user.id, !user.is_active)}
                      >
                        {user.is_active ? 'Block' : 'Unblock'}
                      </DropdownMenuItem>
                    )
                  )}

                  {/* Действия с правами админа */}
                  {user.is_admin && (
                    <>
                      {/* Супер-админ может передать права супер-админа только себе */}
                      {currentUser?.is_superadmin && user.id === currentUser.id && (
                        <>
                          {transferAdminOpenFor === user.id ? (
                            <div className="p-2">
                              <input
                                type="email"
                                placeholder="Enter email to transfer"
                                value={transferEmail}
                                onChange={(e) => setTransferEmail(e.target.value)}
                                className="border p-1 rounded w-full"
                              />
                              {transferError && (
                                <div className="text-red-600 text-sm mt-1">{transferError}</div>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => handleTransferAdminSubmit(user.id)}>
                                  Transfer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setTransferAdminOpenFor(null);
                                    setTransferEmail('');
                                    setTransferError('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <DropdownMenuItem onClick={() => setTransferAdminOpenFor(user.id)}>
                              Transfer Superadmin rights
                            </DropdownMenuItem>
                          )}
                        </>
                      )}

                      {/* Обычный админ может снять права у себя */}
                      {user.id === currentUserId && !currentUser?.is_superadmin && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (checkAdminCount() <= 1) {
                              setError('At least one admin must remain.');
                              return;
                            }
                            assignRole(user.id, 'user');
                          }}
                        >
                          Remove Admin
                        </DropdownMenuItem>
                      )}

                      {/* Супер-админ может снять права у других админов */}
                      {user.id !== currentUserId && canRemoveAdmin(user) && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (checkAdminCount() <= 1) {
                              setError('At least one admin must remain.');
                              return;
                            }
                            assignRole(user.id, 'user');
                          }}
                        >
                          Remove Admin
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Обычные пользователи + возможность назначить админом, если текущий юзер админ */}
                  {!user.is_admin && currentUser?.is_admin && (
                    <DropdownMenuItem onClick={() => assignRole(user.id, 'admin')}>
                      Make Admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
