'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';

type Idea = {
  id: string;
  title: string;
  description: string;
};

export default function VotingPage() {
  const router = useRouter();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const currentX = useRef<number>(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://37.27.182.28:3001/v1/voting');
        if (!res.ok) throw new Error('Failed to load idea');
        const data = await res.json();
        setIdea(data);
      } catch (err) {
        console.error('Failed to load idea:', err);
        setIdea(null);
      } finally {
        setLoading(false);
        resetCard();
      }
    };

    fetchIdea();
  }, []);
// Reset card position and dragging state
  const resetCard = () => {
    setOffsetX(0);
    setIsDragging(false);
  };
// Start swipe gesture
  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };
// Update card position during swipe
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || startX.current === null) return;
    currentX.current = e.clientX;
    const deltaX = currentX.current - startX.current;
    setOffsetX(deltaX);
  };
  // Handle end of swipe gesture
  const handlePointerUp = () => {
    if (startX.current === null) return;

    const deltaX = currentX.current - startX.current;
    const threshold = 100; // Minimum distance to trigger a vote

    if (deltaX > threshold) {
      submitVote('like');
    } else if (deltaX < -threshold) {
      submitVote('dislike');
    } else {
      resetCard(); // Not enough movement, reset
    }

    startX.current = null;
  };
  // Submit vote to the backend and fetch next idea

  const submitVote = async (vote: 'like' | 'dislike') => {
    if (!idea) return;

    setIsDragging(false);
    setOffsetX(0);
    setLoading(true);

    try {
      const res = await fetch(`http://37.27.182.28:3001/v1/voting/${idea.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) throw new Error('Failed to submit vote');
      const nextIdea = await res.json();
      setIdea(nextIdea || null);
    } catch (err) {
      console.error('Failed to submit vote:', err);
      setIdea(null);
    } finally {
      setLoading(false);
      resetCard();
    }
  };
  // Calculate overlay opacity based on swipe distance

  const maxOffset = 150;
  const overlayOpacity = Math.min(Math.abs(offsetX) / maxOffset, 1) * 0.3;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-500 flex flex-col justify-center items-center text-white px-4">
        <div className="absolute top-4 left-4">
          <h1 className="text-xl font-bold">IDENDER</h1>
        </div>
        <div className="text-base mt-10">Loading...</div>
      </div>
    );
  }
  // Show message if there are no more ideas
  if (!idea) {
    return (
      <div className="min-h-screen bg-slate-500 flex flex-col justify-center items-center text-white px-4">
        <div className="absolute top-10 left-25">
          <h1 className="text-xl font-bold">IDENDER</h1>
        </div>
        <div className="text-base mt-10 text-center">No more ideas to vote on!</div>
        <Button
          className="mt-6 w-40 rounded-none bg-white text-slate-700 hover:bg-slate-200"
          onClick={() => router.push('/home')}
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
        {/* Overlay for swipe feedback */}
        <div
          className="absolute top-0 left-0 w-full h-full rounded-2xl pointer-events-none z-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        />

        <div className="relative z-10">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-black">{idea.title}</h2>
          <p className="text-gray-800 text-base sm:text-lg">{idea.description}</p>
        </div>
      </div>
    {/* Swipe instructions */}
      <div className="text-sm text-gray-400 mt-4 select-none">
        Swipe left — 👎 | Swipe right — 👍
      </div>
    </div>
  );
}
