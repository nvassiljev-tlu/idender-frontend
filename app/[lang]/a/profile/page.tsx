'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/client';
import axios from 'axios';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'et', label: 'Estonian' },
  { code: 'fr', label: 'French' },
];

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation('common');

  const [user, setUser] = useState({ id: '', firstName: '', lastName: '', email: '' });
  const [selectedLang, setSelectedLang] = useState('en');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState('');

  useEffect(() => {
    const language = typeof params.lang === 'string' ? params.lang : Array.isArray(params.lang) ? params.lang[0] : 'et';
    i18n.changeLanguage(language);
    Cookies.set('lang', language);
    setLang(language);
  }, [params.lang]);

  useEffect(() => {
    async function fetchUser() {
      const token = Cookies.get('sid');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const u = res.data.payload.user;
        setUser({
          id: u.id,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          email: u.email || '',
        });

        if (u.preferred_language) {
          setSelectedLang(u.preferred_language);
          i18n.changeLanguage(u.preferred_language);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Cookies.remove('sid');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpdate = async () => {
    const token = Cookies.get('sid');
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('preferred_language', selectedLang);
      if (file) formData.append('profile_picture', file);

      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/users/${user.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log('Update response:', res.data);
      Cookies.set('lang', selectedLang);
      i18n.changeLanguage(selectedLang);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
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
      <h1 className="text-2xl font-bold mb-6">{t('myProfile')}</h1>

      <div className="bg-slate-600 text-white p-6 rounded-lg shadow w-full max-w-sm space-y-4">
        {showAlert && (
          <Alert className="mb-4 border-green-500 bg-green-100 text-green-700">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <AlertTitle>{t('success')}</AlertTitle>
              <AlertDescription>{t('updateSuccess')}</AlertDescription>
            </div>
          </Alert>
        )}

        <TextField label={t('fullName')} value={`${user.firstName} ${user.lastName}`} />
        <TextField label={t('email')} value={user.email} />

        <div>
          <label className="block text-sm mb-1">{t('preferredLanguage')}</label>
          <select
            className="w-full p-2 border border-slate-400 bg-slate-700 text-white rounded text-sm"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">{t('profilePicture')}</label>
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

        <Button onClick={handleUpdate} className="w-full bg-white text-slate-700 hover:bg-slate-300 rounded-none">
          {t('updateBtn')}
        </Button>

        <Button onClick={() => router.push(`/${lang}/a/home`)} className="w-full bg-slate-700 text-white hover:bg-slate-800 rounded-none">
          {t('backToHome')}
        </Button>
      </div>
    </div>
  );
}

function TextField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full p-2 border border-slate-400 bg-slate-700 text-white rounded text-sm"
      />
    </div>
  );
}
