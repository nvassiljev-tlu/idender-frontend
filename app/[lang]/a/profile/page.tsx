'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
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
        const res = await axios.get('https://api-staging.idender.services.nvassiljev.com/v1/oauth/me', {
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

  const handleUpdate = async () => {
    const token = Cookies.get('sid');
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append('preferred_language', selectedLang);

      await axios.patch(
        `https://api-staging.idender.services.nvassiljev.com/v1/users/${user.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

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
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 flex flex-col min-w-[320px]">
      <main className="w-full max-w-6xl mx-auto p-4 flex-1 overflow-y-auto pt-16 min-w-[320px]">
        <section className="mb-20 w-full max-w-5xl min-w-[320px] sm:min-w-[600px] mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">{t('myProfile')}</h1>

          <div className="bg-white text-slate-800 p-6 rounded-lg shadow w-full space-y-4">
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
                className="w-full p-2 border border-slate-400 bg-white text-slate-800 rounded text-sm"
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

            <Button onClick={handleUpdate} className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-none">
              {t('updateBtn')}
            </Button>

            <Button onClick={() => router.push(`/${lang}/a/home`)} className="w-full bg-slate-600 text-white hover:bg-slate-700 rounded-none">
              {t('backToHome')}
            </Button>
          </div>
        </section>
      </main>

      <div className="h-20 sm:hidden"></div>
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
        className="w-full p-2 border border-slate-400 bg-slate-100 text-slate-800 rounded text-sm"
      />
    </div>
  );
}
