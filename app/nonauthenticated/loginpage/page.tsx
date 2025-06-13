import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-slate-700 mb-6 text-center">Idender</h1>
        
        <form className="space-y-4">
            <div>
                <input
                  type="email"
                  placeholder="Email"
                  className="text-slate-900 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
                  required
                />
            </div>

            <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="text-slate-900 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
                  required
                />
            </div>
              
            <button
                type="submit"
                className="w-full bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-500 transition duration-200"
            >
            Log In
            </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-slate-600">
          <a href="#" className="text-slate-700 hover:underline">Forgot password?</a>
          <span className="mx-2">•</span>
          <Link href="/signup" className="text-slate-700 hover:underline">Sign Up</Link>
        </div>
      </div>
    </main>
  );
}