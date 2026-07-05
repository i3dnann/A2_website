import { useEffect, useRef, useState } from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Roster from "../components/Roster";
import LiveStreams from "../components/LiveStreams";
import Journey from "../components/Journey";
import News from "../components/News";
import Careers from "../components/Careers";
import Faq from "../components/Faq";
import CtaSection from "../components/CtaSection";

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
    <>
      <Features />
      <Roster />
      <LiveStreams />
      <Journey />
      <News />
      <Careers />
      <Faq />
      <CtaSection />
    </>
  );
}

export default function Home() {
  return (
    <main>
      <Hero />
      <DeferredHomeSections />
    </main>
  );
}
