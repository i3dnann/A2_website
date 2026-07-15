import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Hero from "../components/Hero";
import PartnerBar from "../components/PartnerBar";
import HomeLiveStats from "../components/HomeLiveStats";
import CinematicInterlude from "../components/CinematicInterlude";

const Features = lazy(() => import("../components/Features"));
const Roster = lazy(() => import("../components/Roster"));
const Journey = lazy(() => import("../components/Journey"));
const News = lazy(() => import("../components/News"));
const Careers = lazy(() => import("../components/Careers"));
const Faq = lazy(() => import("../components/Faq"));
const CtaSection = lazy(() => import("../components/CtaSection"));

function DeferredHomeSections() {
  const markerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px 0px" }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [visible]);

  if (!visible) {
    return <div ref={markerRef} className="h-px" aria-hidden="true" />;
  }

  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-hidden="true" />}>
      <Features />
      <Roster />
      <Journey />
      <News />
      <Careers />
      <Faq />
      <CtaSection />
    </Suspense>
  );
}

export default function Home() {
  return (
    <main>
      <Hero />
      <HomeLiveStats />
      <PartnerBar />
      <CinematicInterlude />
      <DeferredHomeSections />
    </main>
  );
}
