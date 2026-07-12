import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimatedBackground from "./components/AnimatedBackground";
import BatSwingIntro from "./components/BatSwingIntro";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StickyBanner from "./components/StickyBanner";
import SpotlightSync from "./components/SpotlightSync";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
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
import CareerApplyPage from "./pages/CareerApplyPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import FaqPage from "./pages/FaqPage";
import CharactersPage from "./pages/CharactersPage";
import TermsPage from "./pages/TermsPage";
import { AuthProvider } from "./context/AuthContext";
import { SiteProvider, useSite } from "./context/SiteContext";
import { useAuth } from "./context/AuthContext";
import MaintenancePage from "./pages/MaintenancePage";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ToastProvider } from "./components/Toast";

function AppShell() {
  const location = useLocation();
  const { dir, isArabic } = useLanguage();
  const { content } = useSite();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const showFooter = !["/login", "/register", "/auth/complete", "/dashboard", "/admin"].includes(location.pathname);
  const adminEntry = ["/login", "/auth/complete"].includes(location.pathname);

  if (!loading && content.maintenanceMode && !isAdmin && !adminEntry) return <MaintenancePage />;

  return (
    <div dir={dir} className={`relative min-h-screen text-white selection:bg-orange-500/40 ${isArabic ? "font-sans" : ""}`}>
      <AnimatedBackground />
      <SpotlightSync />
      <BatSwingIntro />
      <Navbar />
      <StickyBanner />
      <AnimatePresence mode="wait">
        <RouteErrorBoundary routeKey={location.pathname}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/server" element={<ServerPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/careers/:id" element={<CareerApplyPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:department" element={<DepartmentsPage />} />
            <Route path="/departments/:department/manage" element={<DepartmentsPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/characters" element={<ProtectedRoute><CharactersPage /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/complete" element={<AuthComplete />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </RouteErrorBoundary>
      </AnimatePresence>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SiteProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </SiteProvider>
    </LanguageProvider>
  );
}
