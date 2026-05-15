'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getPublicApiBaseUrl } from '@/lib/public-api-url';

const API_BASE = getPublicApiBaseUrl();

export type AdminUserRow = {
  id: number;
  phone: string;
  role: string;
  created_at: string;
  balance: string;
  currency: string;
};

type AdminUsersManagementProps = {
  onClose: () => void;
};

export default function AdminUsersManagement({ onClose }: AdminUsersManagementProps) {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const usersRef = useRef<AdminUserRow[]>([]);
  const fetchGenRef = useRef(0);
  usersRef.current = users;

  const fetchUsers = useCallback(async () => {
    setError(null);
    const gen = ++fetchGenRef.current;
    const block = usersRef.current.length === 0;
    if (block) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (fetchGenRef.current !== gen) return;
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Could not load users');
        if (usersRef.current.length === 0) setUsers([]);
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      if (fetchGenRef.current !== gen) return;
      setError('Connection error');
      if (usersRef.current.length === 0) setUsers([]);
    } finally {
      if (fetchGenRef.current === gen) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password) {
      setError('Enter phone and password');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Could not create user');
        return;
      }
      setSuccess('User created');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setAddFormOpen(false);
      void fetchUsers();
    } catch {
      setError('Connection error');
    } finally {
      setCreating(false);
    }
  };

  const showBlockingLoader = loading && users.length === 0;

  return (
    <div className="fixed inset-0 z-[160] flex flex-col bg-[#F8FAFC] text-[#1A202C]">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="min-w-0 pr-2">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">Users</h1>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">Browse accounts · use Add user to create one</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-95"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4 pb-28 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-0.5">
          <h2 className="text-sm font-bold text-slate-800 sm:text-base">All users ({users.length})</h2>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition active:scale-95 hover:bg-slate-50"
            >
              Refresh list
            </button>
            {!addFormOpen ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAddFormOpen(true);
                }}
                className="rounded-full border-2 border-indigo-600 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm transition active:scale-95 hover:bg-indigo-100"
              >
                Add user
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAddFormOpen(false);
                  setPhone('');
                  setPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition active:scale-95 hover:bg-slate-50"
              >
                Cancel add
              </button>
            )}
          </div>
        </div>

        {addFormOpen ? (
          <section
            id="admin-add-user"
            className="mb-4 rounded-2xl border-2 border-indigo-200 bg-white p-4 shadow-md sm:p-5"
          >
            <h3 className="text-base font-bold text-indigo-950 sm:text-lg">New account</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Player account with wallet (0 ETB), same as public sign-up.
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label htmlFor="new-user-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Phone
                </label>
                <input
                  id="new-user-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="min-h-[48px] w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 text-base text-slate-900 outline-none ring-1 ring-slate-200 transition focus:border-indigo-500 focus:bg-white focus:ring-indigo-200"
                  placeholder="e.g. 0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="new-user-pw" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="new-user-pw"
                  type="password"
                  autoComplete="new-password"
                  className="min-h-[48px] w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 text-base text-slate-900 outline-none ring-1 ring-slate-200 transition focus:border-indigo-500 focus:bg-white focus:ring-indigo-200"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="new-user-pw2" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Confirm password
                </label>
                <input
                  id="new-user-pw2"
                  type="password"
                  autoComplete="new-password"
                  className="min-h-[48px] w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 text-base text-slate-900 outline-none ring-1 ring-slate-200 transition focus:border-indigo-500 focus:bg-white focus:ring-indigo-200"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="min-h-[52px] w-full rounded-2xl bg-indigo-600 text-base font-semibold text-white shadow-md transition active:scale-[0.99] disabled:opacity-50"
              >
                {creating ? 'Adding…' : 'Create account'}
              </button>
            </form>
          </section>
        ) : null}

        {showBlockingLoader ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
            <p className="text-sm font-medium text-slate-500">Loading users…</p>
          </div>
        ) : error && users.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-800">
            {error}
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pb-8">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-black/[0.03]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all text-base font-semibold text-slate-900">{u.phone}</p>
                    <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                      {u.role} · ID {u.id}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Joined {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Balance</p>
                    <p className="text-sm font-bold tabular-nums text-slate-900">
                      {Number(u.balance ?? 0).toFixed(2)} <span className="text-xs font-semibold text-orange-600">{u.currency || 'ETB'}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && users.length > 0 ? (
          <div className="fixed bottom-20 left-4 right-4 z-[170] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-lg sm:left-auto sm:right-4 sm:max-w-md">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="fixed bottom-20 left-4 right-4 z-[170] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg sm:left-auto sm:right-4 sm:max-w-md">
            {success}
          </div>
        ) : null}
      </main>
    </div>
  );
}
