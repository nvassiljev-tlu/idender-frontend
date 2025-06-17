'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/client';
import Cookie from 'js-cookie';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function SignupPage() {
  const router = useRouter();
  const params = useParams();
  const lang = typeof params.lang === 'string' ? params.lang : Array.isArray(params.lang) ? params.lang[0] : 'et';
  const { t } = useTranslation('common');

  const [hasMounted, setHasMounted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    i18n.changeLanguage(lang);
    Cookie.set('lang', lang);
    setHasMounted(true);
  }, [lang]);

  if (!hasMounted) return null;

  const showError = (title: string, message: string) => {
    setAlertType('error');
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredDomain = '@tpl.edu.ee';

    if (!emailRegex.test(email) || !email.endsWith(requiredDomain)) {
      showError(t('invalidEmail'), t('emailEndWith'));
      return;
    }

    if (password.length < 8 || password.length > 64) {
      showError(t('invalidPassword'), t('passwordLength'));
      return;
    }

    try {
      const res = await fetch('http://37.27.182.28:3001/v1/oauth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, password }),
      });

      const data: Record<string, unknown> = await res.json();

      if (res.status === 201) {
        setUserEmail(email);
        setShowOtpPopup(true);
        setShowAlert(false);
      } else {
        const message = (data?.errors as string) || t('networkError');
        showError(t('signupFailed'), message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('networkError');
      showError(t('signupFailed'), message);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      showError(t('invalidOtp'), t('otpMessage'));
      return;
    }

    try {
      const res = await fetch('http://37.27.182.28:3001/v1/oauth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: otp }),
      });

      const data: Record<string, unknown> = await res.json();

      if (res.status === 200) {
        setAlertType('success');
        setAlertTitle(t('verified'));
        setAlertMessage(t('otpSuccess'));
        setShowAlert(true);
        setTimeout(() => router.push(`/${lang}/login`), 2000);
      } else {
        showError(t('otpFailed'), (data?.message as string) || t('invalidOtp'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('networkError');
      showError(t('otpFailed'), message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-500 text-slate-800 font-sans px-4">
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-sm w-full">
        <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-slate-700 text-center mb-4">Idender</h1>
        <h2 className="text-lg font-bold text-center mb-4">{t('signup1')}</h2>

        {showAlert && (
          <Alert className={`mb-4 ${alertType === 'error' ? 'border-red-500 bg-red-100 text-red-700' : 'border-green-500 bg-green-100 text-green-700'}`}>
            {alertType === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <div>
              <AlertTitle>{alertTitle}</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </div>
          </Alert>
        )}

        {!showOtpPopup ? (
          <form className="space-y-3" onSubmit={handleSignup}>
            <InputField id="email" type="email" label={t('email')} placeholder="Maari.Maasikas@tpl.edu.ee" />
            <InputField id="firstName" type="text" label={t('firstName')} placeholder="Maari" />
            <InputField id="lastName" type="text" label={t('lastName')} placeholder="Maasikas" />
            <InputField id="password" type="password" label={t('password1')} placeholder="********" />

            <Button type="submit" className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-none">
              {t('signupBtn')}
            </Button>

            <p className="text-center text-sm mt-2 text-slate-700">
              {t('alreadyAccount')}{' '}
              <a href={`/${lang}/login`} className="underline hover:text-slate-500">
                {t('loginHere')}
              </a>
            </p>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
            <label className="block text-sm mb-1 text-slate-700">{t('otpPrompt')}</label>
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>

            <Button type="submit" className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-none">
              {t('verifyOtp')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function InputField({ id, label, placeholder, type }: { id: string; label: string; placeholder: string; type: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1 text-slate-700">{label}</label>
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-400 bg-white text-slate-800 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
      />
    </div>
  );
}
