"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookie from "js-cookie";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Router } from "lucide-react"; 
import { useRouter } from "next/navigation";

type Idea = {
  id: string;
  title: string;
  description: string;
  status: number;
  categories: number[];
  is_anonymus?: number;
  createdAt?: string;
  user_id?: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  user_id: string;
  suggestion_id: string;
  first_name: string;
  last_name: string;
};

export default function IdeaDetailPage() {
  const { id } = useParams();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [voteCount, setVoteCount] = useState({ likes: 0, dislikes: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStatus, setNewStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [lang, setLang] = useState(""); // Language state
  const router = useRouter();

  const statusMap = {
    0: "Created / Pending Moderation",
    1: "On Voting",
    2: "Pending School Administration Decision",
    3: "Approved",
    4: "Declined (by School)",
    5: "Declined (Moderation)",
  };

  useEffect(() => {
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
          const data = await ideaResponse.json();
          setIdea(data.payload.idea || { id, title: "Sample Idea", description: "Sample description", status: 0, categories: [] });
          setIsAdmin(data.payload.is_admin || false); 
          if (!data.payload.idea?.id) {
            console.error("ID not found in payload.idea.id, checking alternatives:", data);
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
          const formattedComments = data.payload.map((c: any) => ({
            id: c.id,
            content: c.comment,
            created_at: c.created_at,
            deleted_at: c.deleted_at,
            user_id: c.user_id,
            suggestion_id: c.suggestion_id,
            first_name: c.first_name || "Unknown",
            last_name: c.last_name || "User",
          }));
          setComments(formattedComments);
        } else {
          console.error("Failed to fetch comments:", await commentsResponse.json());
        }

        const userResponse = await fetch("http://37.27.182.28:3001/v1/oauth/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!userResponse.ok) {
          console.error("Failed to fetch user data:", await userResponse.json());
          setError("Failed to authenticate user.");
          router.push("/et/login");
        }
        const language = Cookie.get("lang") || "et";
        setLang(language);
      } catch (err) {
        setError("An error occurred while fetching data.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
        setComments((prev) => [
          ...prev,
          {
            id: newCommentData.id,
            content: newCommentData.comment,
            created_at: newCommentData.created_at,
            deleted_at: newCommentData.deleted_at,
            user_id: newCommentData.user_id,
            suggestion_id: newCommentData.suggestion_id,
            first_name: newCommentData.first_name || "Unknown",
            last_name: newCommentData.last_name || "User",
          },
        ]);
        setNewComment("");
      } else {
        const errorData = await response.json();
        setError(`Failed to add comment: ${errorData.errors?.error || "Unknown error"}`);
      }
    } catch (err) {
      setError("An error occurred while adding comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin) return;
    try {
      const token = Cookie.get("sid");
      const response = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        setError("Failed to delete comment.");
        console.error("Delete comment response:", await response.json());
      }
    } catch (err) {
      setError("An error occurred while deleting comment.");
      console.error("Delete comment error:", err);
    }
  };

  const handleStatusChange = async () => {
    if (!isAdmin || newStatus === null) return;
    try {
      const token = Cookie.get("sid");
      const response = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setIdea((prev) => (prev ? { ...prev, status: newStatus } : null));
        setNewStatus(null);
      } else {
        setError("Failed to update status.");
        console.error("Update status response:", await response.json());
      }
    } catch (err) {
      setError("An error occurred while updating status.");
      console.error("Update status error:", err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Alert className="border-red-500 bg-red-100 text-red-700">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-start p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">{idea.title}</h1>
      <p className="mb-4">{idea.description}</p>
      <p className="mb-4">Status: {statusMap[idea.status]}</p>

      {/* Comments */}
      <div className="w-full max-w-2xl mb-4">
        <h2 className="text-lg font-semibold mb-2">Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="bg-slate-600 p-3 rounded mb-2 flex justify-between items-start">
            <p>
              {comment.content} <span className="text-sm text-gray-400">by {comment.first_name} {comment.last_name}</span>
            </p>
            {isAdmin && (
              <Button variant="destructive" size="icon" onClick={() => handleDeleteComment(comment.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 bg-slate-700 text-white rounded"
          />
          <Button onClick={handleAddComment}>Add</Button>
        </div>
      </div>

      {/* Vote counter (only for admin) */}
      {isAdmin && (
        <div className="mb-4 bg-slate-600 p-3 rounded">
          <h3 className="text-lg font-semibold">Voting Results (Admin Only)</h3>
          <p>Likes: {voteCount.likes}</p>
          <p>Dislikes: {voteCount.dislikes}</p>
        </div>
      )}

      {/* Status change (only for admin) */}
      {isAdmin && (
        <div className="mb-4 bg-slate-600 p-3 rounded">
          <h3 className="text-lg font-semibold">Change Status</h3>
          <select
            value={newStatus || ""}
            onChange={(e) => setNewStatus(Number(e.target.value))}
            className="p-2 bg-slate-700 text-white rounded"
          >
            <option value="">Select status</option>
            {Object.entries(statusMap).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
          <Button onClick={handleStatusChange} className="ml-2">Update Status</Button>
        </div>
      )}
    </div>
  );
}
