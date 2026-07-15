import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import StickyBanner from "./components/StickyBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import Home from "./pages/Home";
import { AuthProvider } from "./context/AuthContext";
import { SiteProvider, useSite } from "./context/SiteContext";
import { useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ToastProvider } from "./components/Toast";
import ScrollProgress from "./components/ScrollProgress";
import { LiveStatusProvider } from "./context/LiveStatusContext";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthComplete = lazy(() => import("./pages/AuthComplete"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ServerPage = lazy(() => import("./pages/ServerPage"));
const RosterPage = lazy(() => import("./pages/RosterPage"));
const LivePage = lazy(() => import("./pages/LivePage"));
const JourneyPage = lazy(() => import("./pages/JourneyPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const CareerApplyPage = lazy(() => import("./pages/CareerApplyPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const CharactersPage = lazy(() => import("./pages/CharactersPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const ContractVerifyPage = lazy(() => import("./pages/ContractVerifyPage"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

function RouteFallback() {
  return <div className="min-h-screen bg-[#06070b]" aria-label="Loading page" />;
}

function AppShell() {
  const location = useLocation();
  const { dir, isArabic } = useLanguage();
  const { content } = useSite();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--site-primary", content.primaryHex || "#60519b");
    root.style.setProperty("--site-accent", content.accentHex || "#8a7ac4");
  }, [content.accentHex, content.primaryHex]);

  const showFooter = !["/login", "/register", "/auth/complete", "/dashboard", "/admin"].includes(location.pathname);
  const adminEntry = ["/login", "/auth/complete"].includes(location.pathname);

  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const maintenancePreview = isLocalPreview ? new URLSearchParams(location.search).get("maintenance-preview") : null;
  const forceMaintenance = maintenancePreview === "1";
  const bypassMaintenance = maintenancePreview === "0";
  if (!loading && !adminEntry && (forceMaintenance || (!bypassMaintenance && content.maintenanceMode && !isAdmin))) {
    return <Suspense fallback={<RouteFallback />}><MaintenancePage /></Suspense>;
  }

  return (
    <div dir={dir} className={`cinematic-site relative min-h-screen bg-background text-foreground selection:bg-violet-500/35 ${isArabic ? "font-sans" : ""}`}>
      <ScrollProgress />
      <AnimatedBackground />
      <Navbar />
      <StickyBanner />
      <RouteErrorBoundary routeKey={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/server" element={<ServerPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/careers/:id" element={<CareerApplyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/characters" element={<ProtectedRoute><CharactersPage /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
            <Route path="/contracts/verify/:code" element={<ContractVerifyPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/complete" element={<AuthComplete />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
        <SiteProvider>
          <LiveStatusProvider>
            <AuthProvider>
              <ToastProvider>
                <BrowserRouter>
                  <AppShell />
                </BrowserRouter>
              </ToastProvider>
            </AuthProvider>
          </LiveStatusProvider>
        </SiteProvider>
    </LanguageProvider>
  );
}
