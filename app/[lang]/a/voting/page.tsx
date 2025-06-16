'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import Cookie from 'js-cookie';
import { Loader2 } from 'lucide-react';

type Idea = {
  id: string;
  title: string;
  description: string;
};

export default function VotingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdea, setIsFetchingIdea] = useState(false);
  const [lang, setLang] = useState("");

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number>(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetCard = () => {
    setOffsetX(0);
    setIsDragging(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = Cookie.get('sid');
        if (!token) {
          router.push('/login');
          return;
        }

        const sessionResponse = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          Cookie.remove('sid');
          const language = Cookie.get("lang") || 'et';
          router.push(`/${language}/login`);
          return;
        }
        
        const language = Cookie.get("lang") || 'et';
        setLang(language);
      } catch (err) {
        console.error('Error checking session:', err);
        Cookie.remove('sid');
        const language = Cookie.get("lang") || 'et';
        router.push(`/${language}/login`);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const fetchIdea = async () => {
    setIsFetchingIdea(true);
    try {
      const token = Cookie.get('sid');
      const res = await fetch('http://37.27.182.28:3001/v1/voting', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.status === 204) {
        setIdea(null);
        return;
      }

      if (!res.ok) throw new Error('Failed to load idea');

      const data = await res.json();
      if (data.status === 'OPERATION-OK' && data.payload) {
        setIdea(data.payload);
      } else {
        setIdea(null);
      }
    } catch (err) {
      console.error('Failed to load idea:', err);
      setIdea(null);
    } finally {
      setIsFetchingIdea(false);
      resetCard();
    }
  };

  useEffect(() => {
    if (isLoading) return;
    fetchIdea();
  }, [isLoading]);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || startX.current === null) return;
    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    setOffsetX(deltaX);
  };

  const handlePointerUp = () => {
    if (startX.current === null) return;

    const deltaX = currentX.current - startX.current;
    const threshold = 100;

    if (deltaX > threshold) {
      submitVote(1);
    } else if (deltaX < -threshold) {
      submitVote(0);
    } else {
      resetCard();
    }

    startX.current = null;
  };

  const submitVote = async (reaction: 0 | 1) => {
    if (!idea) return;

    setIsDragging(false);
    setOffsetX(0);
    setIsFetchingIdea(true);

    try {
      const token = Cookie.get('sid');
      const res = await fetch(`http://37.27.182.28:3001/v1/voting/${idea.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });

      if (res.status === 204) {
        setIdea(null);
        return;
      }

      if (!res.ok) throw new Error('Failed to submit vote');

      const data = await res.json();
      if (data.status === 'OPERATION-OK' && data.payload) {
        setIdea(data.payload);
      } else {
        setIdea(null);
      }
    } catch (err) {
      console.error('Failed to submit vote:', err);
      setIdea(null);
    } finally {
      setIsFetchingIdea(false);
      resetCard();
    }
  };

  const maxOffset = 150;
  const overlayOpacity = Math.min(Math.abs(offsetX) / maxOffset, 1) * 0.3;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-sm text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isFetchingIdea) {
    return (
      <div className="min-h-screen bg-slate-500 flex flex-col justify-center items-center text-white px-4">
        <div className="absolute top-4 left-4">
          <h1 className="text-xl font-bold">IDENDER</h1>
        </div>
        <div className="flex flex-col items-center gap-2 mt-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-base">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-slate-500 flex flex-col justify-center items-center text-white px-4">
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-bold">IDENDER</h1>
        </div>
        <div className="text-base mt-10 text-center">No more ideas to vote on!</div>
        <Button
          className="mt-6 w-40 rounded-none bg-white text-slate-700 hover:bg-slate-200"
          onClick={() => router.push(`/${lang}/a/home`)}
        >
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-center px-4 py-8 relative">
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
        <h1 className="text-xl font-bold text-white">IDENDER</h1>
      </div>

      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetCard}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
        }}
        className={clsx(
          'relative bg-white w-full max-w-[360px] h-[60vh] rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center select-none touch-none',
          {
            'cursor-grabbing': isDragging,
            'cursor-grab': !isDragging,
          }
        )}
      >
        <div
          className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none z-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />

        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-black">{idea.title}</h2>
          <p className="text-gray-800 text-base sm:text-lg">{idea.description}</p>
        </div>
      </div>

      <div className="text-sm text-gray-400 mt-4 select-none">
        Swipe left — 👎 | Swipe right — 👍
      </div>
    </div>
  );
}