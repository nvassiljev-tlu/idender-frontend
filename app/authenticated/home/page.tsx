'use client';

import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// hovering submenu mousedown hook
function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

export default function IdenderDashboard() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(profileMenuRef, () => setShowProfileMenu(false));

  // check if user is logged in
  useEffect(() => {
    const token = Cookie.get('sid')
    if (!token) {
      router.push('/login')
      return;
    }
    
    const checkLogin = async () => {
      try {
        const res = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
          method: 'GET',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });
        
        if (res.status !== 200) {
          Cookie.remove("sid")
          router.push('/login')
          return;
        }
      } catch (err) {
        console.log(err)
        Cookie.remove("sid")
        router.push('/login')
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, [router]);

  const handleLogout = () => {
    Cookie.remove('sid');
    router.push('/login');
  };

  const handleCreateIdea = () => {
    router.push('/authenticated/new_idea');
  };

  // mock data - replace with actual data fetching
  const news = [
    { id: 1, title: 'Student wins Sudoku award', date: 'May 15, 2025' },
    { id: 2, title: 'Proposed idea to "shut down the cafeteria" has been approved by the school board', date: 'May 25, 2025' },
    { id: 3, title: 'School cafeteria permanently shut down', date: 'June 1, 2025' },
    { id: 4, title: 'Malnourishment in Tallinn French Lyceum hit record levels', date: 'June 2, 2025'}
  ];

  // SVG icons from online
  const VoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const NewspaperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/>
      <path d="M15 18h-5"/>
      <path d="M10 6h8v4h-8V6Z"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-500 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* header */}
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-slate-300 transition-colors"
          aria-label="Logout"
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Logout</span>
        </button>
        
        <h1 className="text-xl font-bold">Idender</h1>
        
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
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
              onMouseLeave={() => setShowProfileMenu(false)}>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/authenticated/my_profile');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/authenticated/my_ideas');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                My Ideas
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/authenticated/settings');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </header>

      {/* main content */}
      <main className="container mx-auto p-4 flex-1 overflow-y-auto pt-16" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
        {/* news section */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-4">
            <NewspaperIcon/>
            <h2 className="text-xl font-bold text-slate-800">News</h2>
          </div>
          
          <div className="grid gap-4">
            {news.map(item => (
              <div 
                key={item.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.date}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* create idea Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
        <div className="flex gap-4 md:gap-8 w-full max-w-md">
          <button
            onClick={handleCreateIdea}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors">
            <PlusIcon />
            <span>Create idea</span>
          </button>
          {/* voting Button */}
          <button onClick={() => router.push('/authenticated/voting')}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-600 transition-colors">
            <VoteIcon />
            <span>Voting</span>
          </button>
        </div>
      </div>

      {/* mobilefriendlier-ish bottom padding */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
}