"use client";


import { LoginForm } from "@/components/login-form"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";

export default function Page() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in
  useEffect(() => {
      const checkLogin = async () => {
        try {
          const res = await fetch('http://37.27.182.28:3001/v1/oauth/me', {
            method: 'GET',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Cookie.get('sid')}` 
            }
          });
  
          const data = await res.json();
  
          if (res.status === 200 && data.payload?.user?.id) {
            router.push ('/authenticated/home');
          } else {
            setLoading(false);
          }
        } catch (err) {
          setError('Could not connect to server.');
          console.log(err)
          setLoading(false);
        }
      };
  
      checkLogin();
    }, []);
  return (
<div className="min-h-screen flex items-center justify-center">
      <div className="bg-white backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-4xl sm:text-6xl md:text-5xl font-bold text-slate-700 text-center">Idender</h1>
        <LoginForm />
      </div>
    </div>
  )

}



