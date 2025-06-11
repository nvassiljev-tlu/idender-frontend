'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function SignupPage() {
  const router = useRouter();

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requiredDomain = '@tpl.edu.ee';

    if (!emailRegex.test(email) || !email.endsWith(requiredDomain)) {
      showError('Invalid Email', `Email must end with "${requiredDomain}"`);
      return;
    }

    if (password.length < 8 || password.length > 64) {
      showError('Invalid Password', 'Password must be 8–64 characters long');
      return;
    }

    try {
      const response = await fetch('http://37.27.182.28:3001/v1/oauth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, password }),
      });

      if (response.status === 201) {
        setUserEmail(email); // Save email for OTP verification
        setShowOtpPopup(true);
        setShowAlert(false);
      } else {
        const data = await response.json();
        showError('Signup Failed', data?.message || 'Something went wrong');
      }
    } catch (error) {
      showError('Network Error', 'Could not connect to server.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      showError('Invalid OTP', 'Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      const response = await fetch('http://37.27.182.28:3001/v1/oauth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: otp }),
      });

      if (response.status === 200) {
        setAlertType('success');
        setAlertTitle('Verified');
        setAlertMessage('OTP verified! Redirecting to login...');
        setShowAlert(true);

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const data = await response.json();
        showError('OTP Failed', data?.message || 'Invalid code.');
      }
    } catch (error) {
      showError('Network Error', 'Could not connect to server.');
    }
  };

  const showError = (title: string, message: string) => {
    setAlertType('error');
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
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

        {!showOtpPopup ? (
          <form className="space-y-3" onSubmit={handleSignup}>
            <InputField id="email" type="email" label="Email" placeholder="Maari.Maasikas@tpl.edu.ee" />
            <InputField id="firstName" type="text" label="First Name" placeholder="Maari" />
            <InputField id="lastName" type="text" label="Last Name" placeholder="Maasikas" />
            <InputField id="password" type="password" label="Password" placeholder="********" />

            <Button type="submit" className="w-full bg-white text-slate-700 hover:bg-slate-300 rounded-none">
              Sign Up
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOtp();
          }}>
            <label className="block text-sm mb-1 text-white">Enter the 6-digit OTP sent to your email</label>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={(val) => setOtp(val)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button type="submit" className="w-full bg-white text-slate-700 hover:bg-slate-300 rounded-none">
              Verify OTP
            </Button>
          </form>
        )}
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
