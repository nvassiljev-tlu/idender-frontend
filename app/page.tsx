'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lang = Cookie.get('lang') || 'en'; // fallback to 'en' if not set
    router.push(`/${lang}/login`);
  }, [router]);

  return null; // or a loader if you want
}
