import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimatedBackground from "./components/AnimatedBackground";
import BatSwingIntro from "./components/BatSwingIntro";
import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthComplete from "./pages/AuthComplete";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ServerPage from "./pages/ServerPage";
import RosterPage from "./pages/RosterPage";
import LivePage from "./pages/LivePage";
import JourneyPage from "./pages/JourneyPage";
import NewsPage from "./pages/NewsPage";
import CareersPage from "./pages/CareersPage";
import FaqPage from "./pages/FaqPage";
import CharactersPage from "./pages/CharactersPage";
import { AuthProvider } from "./context/AuthContext";
import { SiteProvider } from "./context/SiteContext";
import { ToastProvider } from "./components/Toast";

function AppShell({ introDelay }: { introDelay: number }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const showFooter = !["/login", "/register", "/auth/complete", "/dashboard", "/admin"].includes(location.pathname);

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/40">
      <AnimatedBackground />
      <BatSwingIntro replayKey={location.pathname} delay={introDelay} />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/server" element={<ServerPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/characters" element={<ProtectedRoute><CharactersPage /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/complete" element={<AuthComplete />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SiteProvider>
      <AuthProvider>
        <ToastProvider>
          <Preloader show={loading} />
          <BrowserRouter>
            <AppShell introDelay={loading ? 2.05 : 0} />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </SiteProvider>
  );
}
