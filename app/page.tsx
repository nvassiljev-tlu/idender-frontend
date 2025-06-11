import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Testing</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Link to Landing Page */}
        <Link
          href="/nonauthenticated/landing"
          className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
        >
          Go to Landing Page
        </Link>

        {/* Link to Login Page */}
        <Link
          href="/login"
          className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
        >
          Go to Login Page
        </Link>

        {/* Link to Old Login Page */}
        <Link
          href="/nonauthenticated/loginpage"
          className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
        >
          Go to Login placeholder Page
        </Link>

        {/* Link to Signup Page */}
        <Link
          href="/signup"
          className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
        >
          Go to Signup Page
        </Link>

        <Link
          href="/authenticated/home"
          className="bg-blue-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-center transition"
        >
          Home
        </Link>
      </div>
    </main>
  );
}