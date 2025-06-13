'use client'

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Cookie from "js-cookie"
import { useState } from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2),
})

export function LoginForm() {
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useParams()
  const lang = typeof params.lang === "string" ? params.lang : "et"

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
        Cookie.set("sid", data.payload.data.session)
        Cookie.set("lang", data.payload.data.language)
        router.push(`/${data.payload.data.language}/a/home`)
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      setError("An error occurred during login")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Email"
                  className="text-slate-900 h-auto w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
                  required
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mb-8">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  className="text-slate-900 h-auto w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-slate-700"
                  required
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-500 transition duration-200"
        >
          Log In
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-slate-600">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/forgot-password`)}
          className="text-slate-700 hover:underline"
        >
          Forgot password?
        </button>
        <span className="mx-2">•</span>
        <Link href={`/${lang}/signup`} className="text-slate-700 hover:underline">
          Sign Up
        </Link>
      </div>
    </Form>
  )
}
