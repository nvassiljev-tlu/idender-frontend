'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import Cookie from 'js-cookie';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'et', label: 'Estonian' },
  { code: 'fr', label: 'French' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '' });
  const [selectedLang, setSelectedLang] = useState('en');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language
  useEffect(() => {
    const savedLang = Cookies.get('preferredLanguage');
    if (savedLang) setSelectedLang(savedLang);
  }, []);

  // Check session and fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = Cookie.get('sid');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          Cookie.remove('sid');
          router.push('/login');
          return;
        }

        const json = await res.json();
        const userData = json.payload.user || null;

        if (userData) {
          setUser({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        Cookie.remove('sid');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  const handleUpdate = () => {
    Cookies.set('preferredLanguage', selectedLang, { expires: 365 * 100 }); // 100 years
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-500 text-white font-sans px-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-slate-600 text-white p-6 rounded-lg shadow w-full max-w-sm space-y-4">
        {showAlert && (
          <Alert className="mb-4 border-green-500 bg-green-100 text-green-700">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Your data has been successfully updated</AlertDescription>
            </div>
          </Alert>
        )}

        <TextField label="Full Name" value={`${user.firstName} ${user.lastName}`} readOnly />
        <TextField label="Email" value={user.email} readOnly />

        <div>
          <label className="block text-sm mb-1">Preferred Language</label>
          <select
            className="w-full p-2 border border-slate-400 bg-slate-700 text-white rounded text-sm"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Profile Picture</label>
          <input
            type="file"
            accept="image/png"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Profile preview"
              width={100}
              height={100}
              className="mt-2 rounded-full object-cover"
            />
          )}
        </div>

        <Button
          onClick={handleUpdate}
          className="w-full bg-white text-slate-700 hover:bg-slate-300 rounded-none"
        >
          Update
        </Button>

        <Button
          onClick={() => router.push('/authenticated/home')}
          className="w-full bg-slate-700 text-white hover:bg-slate-800 rounded-none"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}

function TextField({ label, value, readOnly = false }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        className="w-full p-2 border border-slate-400 bg-slate-700 text-white rounded text-sm"
      />
    </div>
  );
}