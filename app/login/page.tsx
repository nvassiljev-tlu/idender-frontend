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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">

        <LoginForm />
      </div>
    </div>
  )

}



