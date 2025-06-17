'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookie from "js-cookie";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

type Idea = {
  id: string;
  title: string;
  description: string;
  status: number;
  categories: { id: number; name: string }[];
  is_anonymus?: number;
  createdAt?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
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

function IdeaDetailPageContent() {
  const { id } = useParams();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [voteCount, setVoteCount] = useState({ likes: 0, dislikes: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStatus, setNewStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const router = useRouter();

  const statusMap = {
    0: "Created / Pending Moderation",
    1: "On Voting",
    2: "Pending School Administration Decision",
    3: "Approved",
    4: "Declined (by School)",
    5: "Declined (Moderation)",
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
          const ideaData = data.payload.idea;

          if (ideaData.is_anonymus === 1 && !data.payload.is_admin) {
            ideaData.first_name = "Anonymous";
            ideaData.last_name = "";
          }

          // Ensure categories is always an array of objects
          ideaData.categories = Array.isArray(ideaData.categories) ? ideaData.categories : [];

          setIdea(
            ideaData || {
              id,
              title: "Sample Idea",
              description: "Sample description",
              status: 0,
              categories: [],
            }
          );
          setIsAdmin(data.payload.is_admin || false);

          // If admin and status is "On Voting", fetch likes/dislikes
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
            } else {
              setVoteCount({ likes: 0, dislikes: 0 });
            }
          } else {
            setVoteCount({ likes: 0, dislikes: 0 });
          }
        } else {
          setError("Failed to load idea.");
        }

        // ...comments fetch unchanged...
        const commentsResponse = await fetch(`http://37.27.182.28:3001/v1/ideas/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          const formattedComments = Array.isArray(data.payload)
            ? data.payload.map((c: any) => ({
                id: c.id,
                content: c.comment,
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

        const language = Cookie.get("lang") || "et";
        setLang(language);
      } catch (err) {
        setError("An error occurred while fetching data.");
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    console.log("Current comments state:", comments);
  }, [comments]);

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
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, deleted_at: Date.now().toString() } : c
        ));
      }
    } catch (err) {
      setError("An error occurred while deleting comment.");
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
        setStatusMessage(`Status updated to ${statusMap[newStatus]}`);
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (err) {
      setError("An error occurred while updating status.");
    }
  };

  // Debug log before render
  console.log("Rendering with comments:", comments);

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

  if (loading || !idea) {
    return (
      <div className="min-h-screen bg-slate-500 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-500 flex flex-col items-center justify-start p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">{idea?.title || 'Loading...'}</h1>
      <p className="mb-4">{idea?.description || 'Loading description...'}</p>
      
      {idea && (
        <>
          <p className="mb-4">Status: {statusMap[idea.status]}</p>

          {/* Render category tags as names */}
          {(idea.categories && idea.categories.length > 0) && (
            <div className="mb-4 flex gap-2 flex-wrap">
              {idea.categories.map((category) => (
                <span key={category.id} className="bg-slate-600 text-white px-2 py-1 rounded">
                  {category.name}
                </span>
              ))}
            </div>
          )}

          {(isAdmin || (!idea.is_anonymus || (idea.is_anonymus && !isAdmin))) && (
            <p className="mb-4 text-sm text-gray-400">
              Submitted by: {idea.first_name} {idea.last_name}
            </p>
          )}
          

          {/* Admin view: Show likes/dislikes if status is "On Voting" */}
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
            <h2 className="text-lg font-semibold mb-2">Comments</h2>
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-slate-600 p-3 rounded mb-2 flex justify-between items-start">
                  <div>
                    <p>{comment.content}</p>
                    <div className="text-sm text-gray-400">
                      {comment.deleted_at ? (
                        <>
                          <span>Deleted at {new Date(parseInt(comment.deleted_at)).toLocaleString()}</span>
                          <span className="ml-2 px-2 py-1 bg-red-900 text-xs rounded">DELETED</span>
                        </>
                      ) : (
                        <span>by {comment.first_name} {comment.last_name}</span>
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
              <p>No comments yet.</p>
            )}
            
            <div className="flex gap-2 mt-4">
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

          {isAdmin && (
            <div className="mb-4 bg-slate-600 p-3 rounded">
              <h3 className="text-lg font-semibold">Change Status</h3>
              <select
                value={newStatus || ""}
                onChange={(e) => setNewStatus(Number(e.target.value))}
                className="p-2 bg-slate-700 text-white rounded"
              >
                <option value="">Select status</option>
                {getNextAllowedStatuses(idea.status).map((status) => (
                  <option key={status} value={status}>
                    {statusMap[status]}
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleStatusChange} 
                className="ml-2" 
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </div>
          )}
        </>
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