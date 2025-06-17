'use client';

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Cookie from "js-cookie";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import i18n from '../../../../i18n/client';

interface Idea {
  title: string;
  description: string;
  status: number;
  categories: Array<{ id: number; name: string }>;
  first_name: string;
  last_name: string;
  is_anonymus?: number;
}

interface ApiResponse {
  payload: {
    idea: Idea;
    is_admin: boolean;
  };
}

type Comment = {
    id: number;
    content: string;
    created_at: string;
    deleted_at: string | null;
    user_id: number;
    suggestion_id: number;
    first_name: string;
    last_name: string;
};

function IdeaDetailPageContent() {
  const { id } = useParams();
  const { t } = useTranslation('common');
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [voteCount, setVoteCount] = useState({ likes: 0, dislikes: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStatus, setNewStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const statusMap: Record<number, string> = {
    0: t("status.created"),
    1: t("status.voting"),
    2: t("status.pending_admin"),
    3: t("status.approved"),
    4: t("status.declined_school"),
    5: t("status.declined_moderation"),
  };

  const getNextAllowedStatuses = (currentStatus: number) => {
    switch (currentStatus) {
      case 0: return [1, 5];
      case 1: return [2];
      case 2: return [3, 4];
      default: return [];
    }
  };

  useEffect(() => {
    const language = Cookie.get("lang") || 'et';

    const changeLang = async () => {
      if (i18n.language !== language) {
        await i18n.changeLanguage(language);
      }
    };
    changeLang();

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookie.get("sid");
        if (!token) {
          setError("You must be logged in.");
          setLoading(false);
          return;
        }

        const ideaResponse = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (ideaResponse.ok) {
          const data = await ideaResponse.json() as ApiResponse;
          const ideaData = data.payload.idea;

          if (ideaData.is_anonymus === 1 && !data.payload.is_admin) {
            ideaData.first_name = "Anonymous";
            ideaData.last_name = "";
          }

          ideaData.categories = Array.isArray(ideaData.categories) ? ideaData.categories : [];

          setIdea(ideaData);
          setIsAdmin(data.payload.is_admin || false);

          if (data.payload.is_admin && ideaData.status === 1) {
            // Fetch likes/dislikes from the voting API
            const votesRes = await fetch(`http://37.27.182.28:3001/v1/voting/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: "include",
            });

            if (votesRes.ok) {
              const votesData = await votesRes.json();
              setVoteCount({
                likes: votesData.payload.likes ?? 0,
                dislikes: votesData.payload.dislikes ?? 0,
              });
            }
          }
        } else {
          setError("Failed to load idea.");
        }

        const commentsResponse = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          const formattedComments = Array.isArray(data.payload)
            ? data.payload.map((c: Comment) => ({
                id: c.id,
                content: c.content,
                created_at: c.created_at,
                deleted_at: c.deleted_at,
                user_id: c.user_id,
                suggestion_id: c.suggestion_id,
                first_name: c.first_name || "Unknown",
                last_name: c.last_name || "User",
              }))
            : [];
          setComments(formattedComments);
        } else {
          setComments([]);
        }
      } catch (err) {
        setError(t("error.loading"));
        setComments([]);
        console.error("Error fetching idea or comments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = Cookie.get("sid");
      const response = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCommentData = data.payload[0];
        setComments((prev) => [...prev, {
          id: newCommentData.id,
          content: newCommentData.comment,
          created_at: newCommentData.created_at,
          deleted_at: newCommentData.deleted_at,
          user_id: newCommentData.user_id,
          suggestion_id: newCommentData.suggestion_id,
          first_name: newCommentData.first_name || "Unknown",
          last_name: newCommentData.last_name || "User",
        }]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("An error occurred while adding comment.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!isAdmin) return;
    try {
      const token = Cookie.get("sid");
      const response = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.ok) {
        setComments(comments.map(c =>
          c.id === commentId ? { ...c, deleted_at: Date.now().toString() } : c
        ));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("An error occurred while deleting comment.");
    }
  };

  const handleStatusChange = async () => {
    if (!isAdmin || typeof newStatus !== 'number') return;
    try {
      const token = Cookie.get("sid");
      const response = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setIdea(prev => prev ? { ...prev, status: newStatus } : null);
        setNewStatus(null);
        setStatusMessage(`${t("status.label")}: ${statusMap[newStatus]}`);
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("An error occurred while updating status.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Alert className="border-red-500 bg-red-100 text-red-700">
          <AlertTitle>{t("error.title")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !idea) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-start p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">{idea.title || t("loading.title")}</h1>
      <p className="mb-4">{idea.description || t("loading.description")}</p>

      <p className="mb-4">{t("status.label")}: {statusMap[idea.status as keyof typeof statusMap]}</p>

      {idea.categories?.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {idea.categories.map((category) => (
            <span key={category.id} className="bg-slate-600 text-white px-2 py-1 rounded">
              {category.name}
            </span>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-400">
        {t("submittedBy")}: {idea.first_name} {idea.last_name}
      </p>

      {isAdmin && idea.status === 1 && (
        <div className="flex gap-4 mb-4">
          <span className="inline-flex items-center bg-green-700 text-white px-3 py-1 rounded-full font-semibold">
            👍 {voteCount.likes}
          </span>
          <span className="inline-flex items-center bg-red-700 text-white px-3 py-1 rounded-full font-semibold">
            👎 {voteCount.dislikes}
          </span>
        </div>
      )}

      <div className="w-full max-w-2xl mb-4">
        <h2 className="text-lg font-semibold mb-2">{t("comments")}</h2>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-slate-600 p-3 rounded mb-2 flex justify-between items-start">
              <div>
                <p>{comment.content}</p>
                <div className="text-sm text-gray-400">
                  {comment.deleted_at ? (
                    <>
                      <span>{t("deletedAt")} {new Date(parseInt(comment.deleted_at)).toLocaleString()}</span>
                      <span className="ml-2 px-2 py-1 bg-red-900 text-xs rounded">{t("deleted")}</span>
                    </>
                  ) : (
                    <span>{t("by")} {comment.first_name} {comment.last_name}</span>
                  )}
                </div>
              </div>
              {isAdmin && !comment.deleted_at && (
                <Button variant="destructive" size="icon" onClick={() => handleDeleteComment(comment.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p>{t("noComments")}</p>
        )}

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("addComment")}
            className="flex-1 p-2 bg-slate-700 text-white rounded"
          />
          <Button onClick={handleAddComment}>{t("add")}</Button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 bg-slate-600 p-3 rounded">
          <h3 className="text-lg font-semibold">{t("changeStatus")}</h3>
          <select
            value={newStatus || ""}
            onChange={(e) => setNewStatus(Number(e.target.value))}
            className="p-2 bg-slate-700 text-white rounded"
          >
            <option value="">{t("selectStatus")}</option>
            {getNextAllowedStatuses(idea.status).map((status) => (
              <option key={status} value={status}>
                {statusMap[status]}
              </option>
            ))}
          </select>
          <Button onClick={handleStatusChange} className="ml-2" disabled={!newStatus}>
            {t("updateStatus")}
          </Button>
        </div>
      )}

      {statusMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-md">
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default function IdeaDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-500 flex items-center justify-center"><Loader2 className="w-10 h-10 text-white animate-spin" /></div>}>
      <IdeaDetailPageContent />
    </Suspense>
  );
}