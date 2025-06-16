'use client';

import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

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

const formatDate = (timestamp: string | number, lang: string = 'et') => {
  const date = new Date(Number(timestamp));
  return new Intl.DateTimeFormat('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatRelativeTime = (timestamp: string | number) => {
  const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

export default function IdenderDashboard() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [news, setNews] = useState<Array<{
    id: number;
    title: string;
    description: string;
    created_at: string;
  }>>([]);

  const fetchNews = async () => {
    try {
      const token = Cookie.get('sid');
      const res = await fetch('http://37.27.182.28:3001/v1/news/recent', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setNews(data.payload);
      } else {
        console.error('Failed to fetch news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  };

  useClickOutside(profileMenuRef, () => setShowProfileMenu(false));

  useEffect(() => {
    const token = Cookie.get('sid');
    if (!token) {
      router.push('/login');
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
          Cookie.remove("sid");
          router.push(`/login`);
          return;
        }

        const data = await res.json();
        setIsAdmin(data?.payload?.user.is_admin || false);

        const language = Cookie.get("lang") || 'et';
        setLang(language);
        await fetchNews();
      } catch (err) {
        console.log(err);
        Cookie.remove("sid");
        router.push(`/login`);
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, [router]);

  const handleCreateIdea = () => {
    router.push(`/${lang}/a/new-idea`);
  };

  const VoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z" />
    </svg>
  );

  const NewspaperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
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
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col min-w-[320px]">
      <main className="w-full max-w-6xl mx-auto p-4 flex-1 overflow-y-auto pt-16 min-w-[320px]">
        <section className="mb-20 w-full max-w-5xl min-w-[320px] sm:min-w-[600px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <NewspaperIcon />
            <h2 className="text-xl font-bold text-slate-800">News</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 w-full">{error}</div>
          )}

          {news.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 w-full min-w-[320px]">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center min-h-[150px] flex flex-col justify-center items-center">
                <p className="text-slate-500 mb-2">No news to display.</p>
                <button onClick={fetchNews} className="text-blue-600 hover:text-blue-800 text-sm">Refresh</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 w-full">
              {news.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{formatDate(item.created_at, lang)}</p>
                  {item.description && (
                    <p className="mt-2 text-slate-600">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
        <div className="flex gap-4 md:gap-8 w-full max-w-md">
          <button onClick={handleCreateIdea} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors">
            <PlusIcon />
            <span>Create idea</span>
          </button>
          <button onClick={() => router.push(`/${lang}/a/voting`)} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-600 transition-colors">
            <VoteIcon />
            <span>Voting</span>
          </button>
        </div>
      </div>

      <div className="h-20 sm:hidden"></div>
    </div>
  );
}