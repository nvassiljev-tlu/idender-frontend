import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-center p-4">
      {/* logo, upper left corner */}
      <div className="absolute top-4 left-4">
        <h1 className="text-xl font-bold text-white">IDENDER</h1> {/* min size for mobile */}
      </div>

      {/* middle part, buttons etc. */}
      <div className="flex flex-col items-center text-center mt-10"> 
        <h2 className="text-lg text-white mb-7">Welcome to IDENDER</h2> {/* make text smaller */}
        <div className="sm:space-y-35"> 
          <Link href="/login">
            <Button className="bg-white text-slate-700 hover:bg-slate-200 w-40 rounded-none">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-slate-700 text-white hover:bg-slate-600 w-40 rounded-none">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}