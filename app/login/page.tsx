import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-slate-700 mb-6 text-center">Idender</h1>
        <LoginForm />
      </div>
    </div>
  )
}