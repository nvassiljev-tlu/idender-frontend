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
import { Loader2 } from "lucide-react"; //  Добавлено

export default function IdeaPage() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true); //  Добавлено
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = Cookie.get("sid");
        if (!token) {
          console.error("No token available");
          return;
        }

        const response = await fetch("http://37.27.182.28:3001/v1/ideas/categories", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.payload);
        } else {
          console.error("Failed to fetch categories:", response.status);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false); //  Устанавливаем загрузку в false
      }
    };
    fetchCategories();
  }, []);

  const handleTagChange = (value: string) => {
    const selectedId = categories.find((cat) => cat.name === value)?.id;
    if (selectedId) {
      setTags((prevTags) =>
        prevTags.includes(selectedId)
          ? prevTags.filter((id) => id !== selectedId)
          : [...prevTags, selectedId]
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookie.get("sid");

    if (!token) {
      alert("You must be logged in to submit an idea.");
      return;
    }

    const response = await fetch("http://37.27.182.28:3001/v1/oauth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!response.ok) {
      alert("You are not authorized.");
      return;
    }

    const ideaData = {
      title,
      categories: tags,
      description,
      is_anonymus: isAnonymous ? 1 : 0,
    };

    try {
      const response = await fetch("http://37.27.182.28:3001/v1/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(ideaData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Full API Response:", JSON.stringify(data, null, 2)); // Детальная отладка
        setShowAlert(true);

        // Извлечение ID с проверкой
        let ideaId = data.payload?.idea?.id;
        if (!ideaId) {
          console.error("ID not found in payload.idea.id, checking alternatives:", data); // 
          // Попытка найти ID в других частях ответа (если структура отличается)
          ideaId = data.payload?.id || Object.values(data.payload || {}).find((item: any) => item?.id)?.id;
        }

        if (ideaId) {
          router.push(`/authenticated/new_idea/${ideaId}`);
        } else {
          console.error("No valid ID found in API response:", data);
          alert("Failed to get idea ID from API response. Check console for details.");
        }

        setTitle("");
        setTags([]);
        setDescription("");
        setIsAnonymous(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to submit idea:", errorData);
        alert(`Failed to submit idea: ${errorData.errors?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    }
  };

  // 🔄 Показываем Loader2 пока isLoading === true
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
        <h1 className="text-2xl font-bold text-slate-700 mb-4">New Idea</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-light text-slate-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded"
              style={{ color: "#000000" }}
              placeholder="Add more paid snacks options"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-slate-700">Tags</label>
            <Select onValueChange={handleTagChange} value={categories.find((cat) => tags.includes(cat.id))?.name || ""}>
              <SelectTrigger className="w-full p-2 border border-slate-300 rounded text-black">
                <SelectValue placeholder="Select categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              {tags.map((tagId) => {
                const tagName = categories.find((cat) => cat.id === tagId)?.name;
                return tagName ? (
                  <span key={tagId} className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded mr-1">
                    {tagName} (ID: {tagId})
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-light text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded h-24"
              style={{ color: "#000000" }}
              placeholder="Please add some snacks like Lay's or Pringles"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-light text-slate-700">Anonymous</label>
          </div>
          <Button type="submit" className="w-full bg-slate-800 text-white hover:bg-slate-700 rounded-none">
            Create
          </Button>
        </form>
        {showAlert && (
          <Alert className="mt-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Post created and sent for moderation!</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
