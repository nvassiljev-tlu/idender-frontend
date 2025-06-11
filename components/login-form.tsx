"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import Cookie from "js-cookie"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2),
})

export function LoginForm() {
  const [error, setError] = useState("")
  const router = useRouter()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("http://37.27.182.28:3001/v1/oauth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        // Login successful - redirect or set user state
        Cookie.set("sid", data.payload.data.session)
        router.push("/authenticated/home")
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      setError("An error occurred during login")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" className="text-slate-900 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" className="text-slate-900 w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <div className="text-red-500">{error}</div>}
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
          <Link href="/signuppage" className="text-slate-700 hover:underline">Sign Up</Link>
        </div>
    </Form>
    
    
  )
}
