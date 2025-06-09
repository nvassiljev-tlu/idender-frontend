'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredDomain = '@tpl.edu.ee';

    if (!emailRegex.test(email) || !email.endsWith(requiredDomain)) {
      setAlertType('error');
      setAlertTitle('Invalid Email');
      setAlertMessage(`Email must end with "${requiredDomain}"`);
      setShowAlert(true);
      return;
    }

    if (password.length < 8 || password.length > 64) {
      setAlertType('error');
      setAlertTitle('Invalid Password');
      setAlertMessage('Password must be 8–64 characters long');
      setShowAlert(true);
      return;
    }

    setAlertType('success');
    setAlertTitle('Success');
    setAlertMessage('You have successfully signed up. Redirecting...');
    setShowAlert(true);

    setTimeout(() => {
      router.push('/landingpage');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-500 text-white font-sans px-4">
      <h1 className="text-2xl font-bold mb-6">IDENDER</h1>

      <div className="bg-slate-600 text-white p-6 rounded-lg shadow w-full max-w-sm">
        <h2 className="text-lg font-bold text-center mb-4">Sign Up</h2>

        {showAlert && (
          <Alert className={`mb-4 ${alertType === 'error' ? 'border-red-500 bg-red-100 text-red-700' : 'border-green-500 bg-green-100 text-green-700'}`}>
            {alertType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <AlertTitle>{alertTitle}</AlertTitle>
              <AlertDescription>{alertMessage}</AlertDescription>
            </div>
          </Alert>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <InputField id="email" type="email" label="Email" placeholder="Maari.Maasikas@tpl.edu.ee" />
          <InputField id="firstName" type="text" label="First Name" placeholder="Maari" />
          <InputField id="lastName" type="text" label="Last Name" placeholder="Maasikas" />
          <InputField id="password" type="password" label="Password" placeholder="********" />

          <Button type="submit" className="w-full bg-white text-slate-700 hover:bg-slate-300 rounded-none">
            Sign Up
          </Button>
        </form>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  placeholder,
  type,
}: {
  id: string;
  label: string;
  placeholder: string;
  type: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm mb-1 text-white">{label}</label>
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-400 bg-slate-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-white"
      />
    </div>
  );
}
