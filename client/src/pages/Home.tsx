import Hero from "../components/Hero";
import Features from "../components/Features";
import Roster from "../components/Roster";
import LiveStreams from "../components/LiveStreams";
import Journey from "../components/Journey";
import News from "../components/News";
import Careers from "../components/Careers";
import Faq from "../components/Faq";
import CtaSection from "../components/CtaSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Roster />
      <LiveStreams />
      <Journey />
      <News />
      <Careers />
      <Faq />
      <CtaSection />
    </main>
  );
}
