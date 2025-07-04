"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Cookie from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n/client";

export default function IdeaPage() {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [lang, setLang] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = Cookie.get("sid");
        if (!token) {
          router.push("/et/login");
        }

        const res = await fetch("https://api-staging.idender.services.nvassiljev.com/v1/oauth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          const language = Cookie.get("lang") || "et";
          setLang(language);
          if (i18n.language !== language) {
            await i18n.changeLanguage(language);
          }
        } else {
          Cookie.remove("sid");
          router.push(`/et/login`);
        }
      } catch (err) {
        console.log("Login check error:", err);
        router.push(`/et/login`);
      }
    };

    checkLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookie.get("sid");
        if (!token) return;

        const response = await fetch("https://api-staging.idender.services.nvassiljev.com/v1/ideas/categories", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.payload);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleTagChange = (value: string) => {
    const selectedId = categories.find((cat) => cat.name === value)?.id;
    if (selectedId && !tags.includes(selectedId)) {
      setTags((prevTags) => [...prevTags, selectedId]);
    }
  };

  const removeTag = (tagId: number) => {
    setTags((prevTags) => prevTags.filter((id) => id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookie.get("sid");
    if (!token) {
      setShowAlert(true);
      return alert(t("newIdea1.authRequired"));
    }

    try {
      setIsLoading(true);

      const response = await fetch("https://api-staging.idender.services.nvassiljev.com/v1/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          categories: tags,
          description,
          is_anonymus: isAnonymous ? 1 : 0,
        }),
      });

      if (response.ok) {
        setShowAlert(false); // Hide alert on success
        const data = await response.json();
        const ideaId =
          (data.payload?.id as number | undefined) ||
          (
            Object.values(data.payload || {}).find(
              (i: unknown): i is { id: number } => typeof i === "object" && i !== null && "id" in i && typeof (i as { id: unknown }).id === "number"
            )
          )?.id;

        if (ideaId) {
          setCreateMessage(t("newIdea1.success"));
          setTimeout(() => {
            setCreateMessage("");
            router.push(`/${lang}/a/ideas/${ideaId}`);
          }, 2000);
        } else {
          setShowAlert(true);
          alert(t("newIdea1.errorId"));
        }
      } else {
        setShowAlert(true);
        const err = await response.json();
        alert(`${t("newIdea1.errorSubmit")}: ${err.errors?.error || "Unknown"}`);
      }
    } catch (error) {
      setShowAlert(true);
      console.log("Submit idea error:", error);
      alert(t("newIdea1.generalError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-slate-700 mb-4">{t("newIdea1.title")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-light text-slate-700">{t("newIdea1.form.title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-black"
              placeholder={t("newIdea1.form.placeholderTitle")}
            />
          </div>
          <div>
            <label className="block text-sm font-light text-slate-700">{t("newIdea1.form.tags")}</label>
            <Select onValueChange={handleTagChange} value="">
              <SelectTrigger className="w-full p-2 border border-slate-300 rounded text-black">
                <SelectValue placeholder={t("newIdea1.form.select")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tagId) => {
                const tagName = categories.find((cat) => cat.id === tagId)?.name;
                return tagName ? (
                  <span key={tagId} className="inline-flex items-center bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1">
                    {tagName}
                    <button onClick={() => removeTag(tagId)} className="ml-1 text-red-500 hover:text-red-700">×</button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-light text-slate-700">{t("newIdea1.form.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded h-24 text-black"
              placeholder={t("newIdea1.form.placeholderDescription")}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-light text-slate-700">{t("newIdea1.form.anonymous")}</label>
          </div>
          <Button type="submit" className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-none">
            {t("newIdea1.form.create")}
          </Button>
        </form>
        {showAlert && (
          <Alert className="mt-4">
            <AlertTitle>{t("newIdea1.alert.title")}</AlertTitle>
            <AlertDescription>{t("newIdea1.alert.description")}</AlertDescription>
          </Alert>
        )}
        {createMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-md">
            {createMessage}
          </div>
        )}
      </div>
    </div>
  );
}