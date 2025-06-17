'use client'

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Cookie from "js-cookie"
import { useState, useEffect } from "react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"
import i18n from "../app/i18n/client"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2),
})

export function LoginForm() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const lang = typeof params.lang === "string" ? params.lang : "et"
  const { t } = useTranslation("common")

  useEffect(() => {
    const changeLang = async () => {
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang)
        Cookie.set("lang", lang)
      }
    }
    changeLang()
  }, [lang, router])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
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
    } catch {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
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
                  placeholder={t("email")}
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
                  placeholder={t("password")}
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
          className="w-full bg-slate-800 text-white py-2 px-4 rounded hover:bg-slate-500 transition duration-200 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : null}
          {t("submit")}
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-slate-600">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/forgot-password`)}
          className="text-slate-700 hover:underline"
        >
          {t("forgotPassword")}
        </button>
        <span className="mx-2">•</span>
        <Link href={`/${lang}/signup`} className="text-slate-700 hover:underline">
          {t("signupBtn")}
        </Link>
      </div>
    </Form>
  )
}
