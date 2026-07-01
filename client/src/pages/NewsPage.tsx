import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Pin } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import { api, MOCK } from "../api/client";
import PageShell from "../components/PageShell";
import { CardSkeleton } from "../components/Toast";
import NewsModal, { type NewsPost } from "../components/NewsModal";

export default function NewsPage() {
  const { content } = useSite();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsPost | null>(null);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (MOCK) {
        // Use local news data as fallback
        setPosts(content.news.map((n, i) => ({
          id: `local-${i}`,
          title: n.title,
          excerpt: n.excerpt,
          image: null,
          category: "Announcement",
          tags: "",
          author: "A2 Studio",
          pinned: i === 0,
          likes: 10 + i,
          dislikes: 0,
          comment_count: 0,
          published_at: new Date(n.date).toISOString(),
        })));
        setLoading(false);
        return;
      }
      try {
        const r = await api<{ data: NewsPost[] }>("/api/news");
        if (!cancel) setPosts(r.data);
      } catch {
        // silently ignore, keep empty
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  return (
    <PageShell subtitle={content.newsSubtitle} title={content.newsTitle}>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/40">
          No news posts yet. Check back soon.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((n) => {
            const localIconName = content.news.find((x) => x.title === n.title)?.icon || "Newspaper";
            const Icon = getIcon(localIconName);
            return (
              <motion.button
                key={n.id}
                onClick={() => setSelected(n)}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition-colors hover:border-fuchsia-400/30"
              >
                {n.image ? (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img src={n.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {n.pinned && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-fuchsia-950/60 via-black to-violet-950/60">
                    <Icon size={32} className="text-white/15" />
                    {n.pinned && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] uppercase tracking-wider text-white/40">
                    {new Date(n.published_at).toLocaleDateString()} · {n.category}
                  </p>
                  <h3 className="mt-2 font-serif text-lg text-white">{n.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-white/55">{n.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-300">
                    Read more <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {selected && <NewsModal post={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}
