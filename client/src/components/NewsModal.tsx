import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThumbsDown, ThumbsUp, MessageCircle, X, Pin, Calendar, Tag, User, Loader2 } from "lucide-react";
import { api, MOCK } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast, Skeleton } from "./Toast";

export type NewsPost = {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image?: string | null;
  category: string;
  tags: string;
  author: string;
  pinned: boolean;
  likes: number;
  dislikes: number;
  comment_count: number;
  published_at: string;
};

export type NewsComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export default function NewsModal({ post, onClose }: { post: NewsPost | null; onClose: () => void }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [data, setData] = useState<{ post: NewsPost; comments: NewsComment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<"like" | "dislike" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!post) return;
    let cancel = false;
    setLoading(true);
    if (MOCK) {
      setData({ post: { ...post, content: post.content || post.excerpt + "\n\n(Full content is loaded from the backend in production.)" }, comments: [] });
      setLoading(false);
      return;
    }
    api<{ post: NewsPost; comments: NewsComment[] }>(`/api/news/${post.id}`)
      .then((d) => { if (!cancel) setData(d); })
      .catch((e: any) => push({ kind: "error", message: e?.message || "Failed" }))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [post?.id]);

  if (!post) return null;

  const doVote = async (kind: "like" | "dislike") => {
    if (!user) { push({ kind: "info", message: "Login to vote" }); return; }
    if (MOCK) { setVoted(kind); push({ kind: "success", message: kind === "like" ? "Liked" : "Disliked" }); return; }
    try {
      const r = await api<{ liked: boolean; disliked: boolean }>(`/api/news/${post.id}/${kind}`, { method: "POST" });
      setVoted(r.liked ? "like" : r.disliked ? "dislike" : null);
    } catch (e: any) { push({ kind: "error", message: e?.message || "Failed" }); }
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { push({ kind: "info", message: "Login to comment" }); return; }
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      if (MOCK) {
        setData((d) => d ? { ...d, comments: [{ id: `c${Date.now()}`, author_name: name || user.username, body, created_at: new Date().toISOString() }, ...d.comments] } : d);
        setBody("");
        push({ kind: "success", message: "Comment posted (demo)" });
      } else {
        const r = await api<{ pending: boolean }>(`/api/news/${post.id}/comments`, { method: "POST", body: { author_name: name || user.username, body } });
        setBody(""); setName("");
        push({ kind: "success", message: r.pending ? "Comment submitted for approval" : "Comment posted" });
      }
    } catch (e: any) { push({ kind: "error", message: e?.message || "Failed" }); }
    finally { setSubmitting(false); }
  };

  const full = data?.post || post;
  const tags = (full.tags || "").split(",").map(t => t.trim()).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0a0710] shadow-2xl"
        >
          <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/80 hover:bg-white/10">
            <X size={16} />
          </button>

          {full.image && (
            <div className="relative h-56 overflow-hidden rounded-t-2xl sm:h-72">
              <img src={full.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0710] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-4 h-40" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 font-medium text-fuchsia-200">{full.category}</span>
                  {full.pinned && <span className="flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200"><Pin size={11} /> Pinned</span>}
                  <span className="flex items-center gap-1 text-white/50"><Calendar size={12} /> {new Date(full.published_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-white/50"><User size={12} /> {full.author}</span>
                </div>
                <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">{full.title}</h2>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                        <Tag size={10} /> {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                  {full.content || full.excerpt}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                  <button onClick={() => doVote("like")}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      voted === "like" ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200" : "border-white/10 text-white/60 hover:text-white"
                    }`}>
                    <ThumbsUp size={13} /> {full.likes || 0}
                  </button>
                  <button onClick={() => doVote("dislike")}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      voted === "dislike" ? "border-red-400/50 bg-red-400/15 text-red-200" : "border-white/10 text-white/60 hover:text-white"
                    }`}>
                    <ThumbsDown size={13} /> {full.dislikes || 0}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-white/40"><MessageCircle size={13} /> {full.comment_count || 0} comments</span>
                </div>

                {/* Comments */}
                <div className="mt-6">
                  <h3 className="font-serif text-base text-white">Comments</h3>
                  {user && (
                    <form onSubmit={submitComment} className="mt-3 flex flex-col gap-2">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={user.username}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400/50" />
                      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} required maxLength={1000} placeholder="Write a comment..."
                        className="resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-fuchsia-400/50" />
                      <div className="flex justify-end">
                        <button type="submit" disabled={submitting}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                          {submitting && <Loader2 size={13} className="animate-spin" />} Post Comment
                        </button>
                      </div>
                    </form>
                  )}
                  <div className="mt-4 flex flex-col gap-3">
                    {(!data?.comments || data.comments.length === 0) && (
                      <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-white/40">No comments yet. Be the first to reply.</p>
                    )}
                    {data?.comments.map((c) => (
                      <div key={c.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-white">{c.author_name}</span>
                          <span className="text-white/30">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-white/75 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
