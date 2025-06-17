'use client';

import { useEffect, useRef, useState } from 'react';
import Cookie from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [lang, setLang] = useState('et');
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const cookieLang = Cookie.get('lang');
    const urlLang = pathname.split('/')[1];
    const supportedLangs = ['et', 'en', 'fr'];

    const detectedLang =
      (cookieLang && supportedLangs.includes(cookieLang))
        ? cookieLang
        : urlLang && supportedLangs.includes(urlLang)
        ? urlLang
        : 'et';

    setLang(detectedLang);

    if (!cookieLang || cookieLang !== detectedLang) {
      Cookie.set('lang', detectedLang, { expires: 365 });
    }
  }, [pathname]);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const token = Cookie.get('sid');
        if (!token) {
          setIsAdmin(false);
          return;
        }

        const response = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.payload.user.is_admin || false);
        } else {
          setIsAdmin(false);
        }

        console.log('Admin status fetched:', isAdmin);
      } catch (err) {
        setIsAdmin(false);
      }
    };

    fetchAdminStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const token = Cookie.get('sid');
      const response = await fetch('http://37.27.182.28:3001/v1/oauth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Cookie.remove('sid');
        router.push(`/${lang}/login`);
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      Cookie.remove('sid');
      router.push(`/${lang}/login`);
    }
  };

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );

  return (
    <header className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-20 w-full">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 hover:text-slate-300 transition-colors"
        aria-label="Logout"
      >
        <LogoutIcon />
        <span className="hidden sm:inline">Logout</span>
      </button>
      <button
        onClick={() => router.push(`/${lang}/a/home`)}
        className="text-xl font-bold hover:text-slate-300 transition-colors"
        aria-label="Return to home"
      >
        Idender
      </button>

      <div className="relative" ref={profileMenuRef}>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="p-1 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="Profile menu"
          aria-expanded={showProfileMenu}
        >
          <UserIcon />
        </button>

        {showProfileMenu && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50" // <-- z-50 instead of z-20
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
              onClick={() => {
                setShowProfileMenu(false);
                router.push(`/${lang}/a/profile`);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              My Profile
            </button>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                router.push(`/${lang}/a/ideas/my`);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              My Ideas
            </button>
            {/* Admin-only buttons */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push(`/${lang}/a/ideas/all`);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  All Ideas
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push(`/${lang}/a/users`);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  All Users
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
