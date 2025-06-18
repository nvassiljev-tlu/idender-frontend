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
  author?: string;
  categories?: { id: number; name: string }[];
};

export default function VotingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdea, setIsFetchingIdea] = useState(false);
  const [lang, setLang] = useState('');
  const [isCardVisible, setIsCardVisible] = useState(true);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number>(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetCard = () => {
    setOffsetX(0);
    setIsDragging(false);
    setIsCardVisible(true);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = Cookie.get('sid');
        const language = Cookie.get('lang') || 'et';
        setLang(language);

        if (!token) {
          router.push(`/${language}/login`);
          return;
        }

        const sessionResponse = await fetch('https://api-staging.idender.services.nvassiljev.com/v1/oauth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sessionResponse.ok) {
          Cookie.remove('sid');
          router.push(`/${language}/login`);
          return;
        }

        setIsFetchingIdea(true);
        const ideaRes = await fetch('https://api-staging.idender.services.nvassiljev.com/v1/voting', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (ideaRes.status === 204) {
          setIdea(null);
        } else if (ideaRes.ok) {
          const data = await ideaRes.json();
          if (data.status === 'OPERATION-OK' && data.payload) {
            setIdea({
              id: data.payload.id,
              title: data.payload.title,
              description: data.payload.description,
              author: data.payload.author,
              categories: data.payload.categories || [],
            });
          } else {
            setIdea(null);
          }
        } else {
          throw new Error('Failed to load idea');
        }
      } catch (err) {
        console.error('Initialization failed:', err);
        Cookie.remove('sid');
        const language = Cookie.get('lang') || 'et';
        router.push(`/${language}/login`);
      } finally {
        setIsFetchingIdea(false);
        setIsLoading(false);
        resetCard();
      }
    };

    init();
  }, [router]);

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
    setIsCardVisible(false);
    setOffsetX(0);
    setIsFetchingIdea(true);

    try {
      const token = Cookie.get('sid');
      const res = await fetch(`https://api-staging.idender.services.nvassiljev.com/v1/voting/${idea.id}`, {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (isFetchingIdea) {
    return (
      <div className="min-h-screen w-full bg-slate-500 flex flex-col justify-center items-center text-white px-0 py-8 relative">
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
    <div className="min-h-screen w-full bg-slate-500 flex flex-col items-center justify-center px-0 py-8 relative">
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetCard}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
          visibility: isCardVisible ? 'visible' : 'hidden',
          opacity: Math.max(1 - Math.abs(offsetX) / 200, 0),
        }}
        className={clsx(
          'relative bg-white w-full max-w-[360px] h-[60vh] rounded-2xl shadow-lg p-6 flex flex-col justify-between text-center select-none touch-none',
          {
            'cursor-grabbing': isDragging,
            'cursor-grab': !isDragging,
          }
        )}
      >
        <div className="relative z-10 overflow-hidden flex-1 flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-black">{idea.title}</h2>
          <div className="overflow-auto max-h-[25vh] px-1">
            <p className="text-gray-800 text-base sm:text-lg text-left whitespace-pre-wrap">{idea.description}</p>
          </div>
        </div>

        <div className="relative z-10 mt-6">
          {idea.categories && idea.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-2">
              {idea.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="bg-slate-600 text-white px-2 py-1 rounded text-xs"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          {idea.author && (
            <div className="text-xs text-gray-500 mt-1">
              Submitted by: {idea.author}
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-400 mt-4 select-none">
        Swipe left — 👎 | Swipe right — 👍
      </div>
    </div>
  );
}
