import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
  Search,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { api } from "../../api/client";
import type {
  NewspaperBlock,
  NewspaperBundle,
  NewspaperIssue,
  NewspaperPage,
} from "./types";

const SOUND_KEY = "gotham-newspaper-sound";
function articleText(block: NewspaperBlock) {
  return (
    block.body ||
    block.deck ||
    "Open this edition to read the complete story from Gotham City."
  );
}
function dateLabel(value?: string) {
  return new Date(value || Date.now()).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PrintedArticle({
  block,
  onRead,
}: {
  block: NewspaperBlock;
  onRead: (block: NewspaperBlock) => void;
}) {
  return (
    <article className={`newsprint-article ${block.lead ? "is-lead" : ""}`}>
      {block.category ? (
        <p className="newsprint-category">{block.category}</p>
      ) : null}
      <button className="newsprint-headline" onClick={() => onRead(block)}>
        {block.headline || "Untitled Story"}
      </button>
      {block.deck ? <p className="newsprint-deck">{block.deck}</p> : null}
      {block.image ? (
        <figure>
          <img
            src={block.image}
            alt={block.headline || "News photograph"}
            loading="lazy"
          />
          <figcaption>
            {block.caption || "Gotham Gazette staff photograph"}
          </figcaption>
        </figure>
      ) : null}
      <p className="newsprint-byline">
        By {block.author || "Gotham City Newsroom"}
      </p>
      <p className="newsprint-copy">{articleText(block)}</p>
    </article>
  );
}

function FreeformPrintedBlock({ block, onRead }: { block: NewspaperBlock; onRead: (block: NewspaperBlock) => void }) {
  const style: React.CSSProperties = { left:`${block.x}%`, top:`${block.y}%`, width:`${block.width}%`, height:`${block.height}%`, zIndex:block.z, fontSize:`clamp(5px, ${(block.fontSize||16)/700*45}vw, ${block.fontSize||16}px)`, fontFamily:block.fontFamily||"Georgia", fontWeight:block.fontWeight||400, textAlign:block.textAlign||"left", color:block.color||"var(--ink)", background:block.background||"transparent", borderWidth:block.borderWidth||0, padding:`${block.padding??4}px`, transform:`rotate(${block.rotation||0}deg)`, opacity:block.opacity??1 };
  if(block.type==="image") return <div className="free-print-block image" style={style}>{block.image&&<img src={block.image} alt={block.caption||"Newspaper image"} style={{objectFit:block.fit||"cover"}}/>}</div>;
  if(block.type==="divider") return <div className="free-print-block divider" style={style}/>;
  return <article className={`free-print-block type-${block.type}`} style={style} onClick={()=>onRead(block)}>{block.category&&<small>{block.category}</small>}{block.headline&&<h2>{block.headline}</h2>}<p>{block.deck||block.body}</p>{block.type==="article"&&block.author&&<em>By {block.author}</em>}</article>;
}

function PrintedPage({
  page,
  bundle,
  onRead,
}: {
  page: NewspaperPage;
  bundle: NewspaperBundle;
  onRead: (block: NewspaperBlock) => void;
}) {
  const isFront = page.page_number === 1 || page.template_key === "front-page";
  const isFreeform = page.blocks.some((block) => [block.x, block.y, block.width, block.height].every(Number.isFinite));
  return (
    <section
      className={`newspaper-sheet template-${page.template_key}`}
      aria-label={`Page ${page.page_number}`}
    >
      <div className="paper-noise" aria-hidden="true" />
      {!isFreeform && <header className="newsprint-page-header">
        <span>{page.section_name || "City Edition"}</span>
        <span>{dateLabel(bundle.issue.publication_date)}</span>
        <span>Page {page.page_number}</span>
      </header>}
      {!isFreeform && (isFront ? (
        <>
          <div className="newsprint-masthead">
            {bundle.settings.newspaper_name}
          </div>
          <div className="newsprint-rule">
            <span>VOL. {bundle.issue.issue_number}</span>
            <span>{bundle.settings.motto || "The voice of Gotham City"}</span>
            <span>$2.00</span>
          </div>
        </>
      ) : (
        <div className="newsprint-section-title">
          {page.section_name || page.internal_label || "Gotham News"}
        </div>
      ))}
      {isFreeform ? <div className="free-print-layout">{page.blocks.map((block,index)=><FreeformPrintedBlock key={block.id||index} block={block} onRead={onRead}/>)}</div> : <div
        className={`newsprint-layout ${isFront ? "front-layout" : "columns-layout"}`}
      >
        {page.blocks.length ? (
          page.blocks.map((block, index) => (
            <PrintedArticle
              key={`${block.article_id || block.headline}-${index}`}
              block={block}
              onRead={onRead}
            />
          ))
        ) : (
          <div className="newsprint-empty">
            <strong>This page intentionally left open.</strong>
            <span>New stories will appear in the next edition.</span>
          </div>
        )}
      </div>}
      <footer className="newsprint-footer">
        <span>{bundle.settings.newspaper_name}</span>
        <span>Issue {bundle.issue.issue_number}</span>
        <strong>{page.page_number}</strong>
      </footer>
    </section>
  );
}

export default function NewspaperReader() {
  const reduceMotion = useReducedMotion();
  const [bundle, setBundle] = useState<NewspaperBundle | null>(null);
  const [issues, setIssues] = useState<NewspaperIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [sound, setSound] = useState(
    () => localStorage.getItem(SOUND_KEY) !== "off",
  );
  const [archive, setArchive] = useState(false);
  const [reader, setReader] = useState<NewspaperBlock | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;
  const step = isMobile ? 1 : 2;
  const load = useCallback(async (path = "/api/newspaper/latest") => {
    setLoading(true);
    setError("");
    try {
      const [next, archiveResult] = await Promise.all([
        api<NewspaperBundle>(path),
        api<{ rows: NewspaperIssue[] }>("/api/newspaper/issues"),
      ]);
      setBundle(next);
      setIssues(archiveResult.rows || []);
      setIndex(0);
    } catch (e: any) {
      setError(e?.message || "The newspaper could not be opened.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const playSound = useCallback(() => {
    if (!sound || reduceMotion) return;
    if (bundle?.settings.sound_url) {
      if (!audioRef.current) audioRef.current = new Audio(bundle.settings.sound_url);
      const audio = audioRef.current; audio.pause(); audio.currentTime = 0; audio.volume = 0.22; audio.play().catch(() => {}); return;
    }
    try {
      const Context = window.AudioContext || (window as any).webkitAudioContext;
      const context = audioContextRef.current || new Context(); audioContextRef.current=context;
      const length=Math.floor(context.sampleRate*.34), buffer=context.createBuffer(1,length,context.sampleRate), data=buffer.getChannelData(0); let last=0;
      for(let i=0;i<length;i++){const white=Math.random()*2-1;last=last*.82+white*.18;data[i]=last*(1-i/length)*.7}
      const source=context.createBufferSource(), filter=context.createBiquadFilter(), gain=context.createGain(); source.buffer=buffer;filter.type="bandpass";filter.frequency.value=1450;filter.Q.value=.5;gain.gain.setValueAtTime(.001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.16,context.currentTime+.025);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.34);source.connect(filter).connect(gain).connect(context.destination);source.start();
    } catch {}
  }, [sound, reduceMotion, bundle]);
  const turn = useCallback(
    (direction: number) => {
      if (!bundle) return;
      setIndex((current) =>
        Math.max(
          0,
          Math.min(bundle.pages.length - step, current + direction * step),
        ),
      );
      playSound();
    },
    [bundle, step, playSound],
  );
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (reader) {
        if (event.key === "Escape") setReader(null);
        return;
      }
      if (event.key === "ArrowRight") turn(1);
      if (event.key === "ArrowLeft") turn(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reader, turn]);
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, sound ? "on" : "off");
  }, [sound]);
  const visible = useMemo(
    () => bundle?.pages.slice(index, index + step) || [],
    [bundle, index, step],
  );
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await shellRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };
  if (loading)
    return (
      <div className="newspaper-state">
        <div className="newspaper-loader" />
        <p>Setting the type and opening today&apos;s edition…</p>
      </div>
    );
  if (error || !bundle)
    return (
      <div className="newspaper-state">
        <p>{error || "No published edition is available."}</p>
        <button onClick={() => load()}>Try again</button>
      </div>
    );
  return (
    <div
      ref={shellRef}
      className="newspaper-reader"
      style={
        {
          "--paper": bundle.settings.style.paperColor || "#e8ddc4",
          "--ink": bundle.settings.style.inkColor || "#171512",
          "--news-accent": bundle.settings.style.accentColor || "#6b2525",
        } as React.CSSProperties
      }
    >
      <div className="newspaper-toolbar">
        <div className="toolbar-group">
          <button onClick={() => setArchive(true)}>
            <Archive size={16} /> Archive
          </button>
          <button onClick={() => setArchive(true)}>
            <BookOpen size={16} /> Contents
          </button>
        </div>
        <div className="toolbar-group">
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
          >
            <ZoomOut size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.35, z + 0.1))}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setSound((v) => !v)}
            aria-label={sound ? "Mute paper sound" : "Enable paper sound"}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button onClick={() => setReader(visible[0]?.blocks[0] || null)}>
            <BookOpen size={16} /> Reader
          </button>
          <button onClick={toggleFullscreen}>
            {fullscreen ? <Minimize size={16} /> : <Expand size={16} />}{" "}
            Fullscreen
          </button>
        </div>
        <div className="toolbar-group nav-group">
          <button aria-label="First page" onClick={() => setIndex(0)}>
            <SkipBack size={16} />
          </button>
          <button
            aria-label="Previous page"
            disabled={index === 0}
            onClick={() => turn(-1)}
          >
            <ChevronLeft size={17} /> Prev
          </button>
          <span>
            {Math.min(index + 1, bundle.pages.length)}–
            {Math.min(index + step, bundle.pages.length)} /{" "}
            {bundle.pages.length}
          </span>
          <button
            aria-label="Next page"
            disabled={index + step >= bundle.pages.length}
            onClick={() => turn(1)}
          >
            Next <ChevronRight size={17} />
          </button>
          <button
            aria-label="Last page"
            onClick={() => setIndex(Math.max(0, bundle.pages.length - step))}
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
      <motion.div
        ref={stageRef}
        className="newspaper-stage"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragStart={() => { stageRef.current?.classList.add("is-dragging"); playSound(); }}
        onDrag={(_,info)=>{shellRef.current?.style.setProperty("--drag-x",`${info.offset.x}px`)}}
        onDragEnd={(_, info) => {
          shellRef.current?.style.setProperty("--drag-x","0px");
          stageRef.current?.classList.remove("is-dragging");
          if (Math.abs(info.offset.x) > 80) turn(info.offset.x < 0 ? 1 : -1);
        }}
        style={{ scale: zoom }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((page, pageIndex) => (
            <motion.div
              key={page.id}
              className={`newspaper-page-wrap ${pageIndex === 0 ? "left-page" : "right-page"}`}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0.3,
                      rotateY: pageIndex === 0 ? -12 : 12,
                      x: pageIndex === 0 ? -50 : 50,
                    }
              }
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, rotateY: pageIndex === 0 ? 70 : -70 }
              }
              transition={{
                duration: reduceMotion
                  ? 0.18
                  : (bundle.settings.style.pageTurnSpeed || 720) / 1000,
                ease: [0.22, 0.8, 0.24, 1],
              }}
            >
              <PrintedPage page={page} bundle={bundle} onRead={setReader} />
              <button
                className={`page-edge ${pageIndex === 0 ? "previous" : "next"}`}
                aria-label={
                  pageIndex === 0
                    ? "Turn to previous page"
                    : "Turn to next page"
                }
                onClick={() => turn(pageIndex === 0 ? -1 : 1)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <div className="mobile-paper-nav">
        <button disabled={index === 0} onClick={() => turn(-1)}>
          <ChevronLeft /> Previous
        </button>
        <span>Page {index + 1}</span>
        <button
          disabled={index + 1 >= bundle.pages.length}
          onClick={() => turn(1)}
        >
          Next <ChevronRight />
        </button>
      </div>
      <AnimatePresence>
        {archive ? (
          <motion.aside
            className="newspaper-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
          >
            <div className="drawer-title">
              <div>
                <h2>Edition Archive</h2>
                <p>Browse published Gotham newspapers.</p>
              </div>
              <button
                aria-label="Close archive"
                onClick={() => setArchive(false)}
              >
                <X />
              </button>
            </div>
            <label className="archive-search">
              <Search size={16} />
              <input placeholder="Search editions" />
            </label>
            <button
              className="archive-item is-current"
              onClick={() => {
                load();
                setArchive(false);
              }}
            >
              <strong>Latest Edition</strong>
              <span>Return to today&apos;s newspaper</span>
            </button>
            {issues.map((issue) => (
              <button
                className="archive-item"
                key={issue.id}
                onClick={() => {
                  load(`/api/newspaper/issues/${issue.slug}`);
                  setArchive(false);
                }}
              >
                <strong>{issue.name}</strong>
                <span>
                  Issue {issue.issue_number} ·{" "}
                  {dateLabel(issue.publication_date)}
                </span>
              </button>
            ))}
          </motion.aside>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {reader ? (
          <motion.div
            className="reader-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Article reader"
          >
            <button className="reader-close" onClick={() => setReader(null)}>
              <X /> Close
            </button>
            <article>
              <p>{reader.category || "Gotham News"}</p>
              <h1>{reader.headline}</h1>
              <h2>{reader.deck}</h2>
              {reader.image ? (
                <img src={reader.image} alt={reader.headline} />
              ) : null}
              <div className="reader-byline">
                By {reader.author || "Gotham City Newsroom"}
              </div>
              <div className="reader-body">{articleText(reader)}</div>
            </article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
