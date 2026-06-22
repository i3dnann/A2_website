import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import { CareerDetailPage, FaqPage, PublicCollection, PublicDetail, TermsPage } from "./pages/PublicCollection.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";
import { LivePage, StreamerDetail, StreamersPage } from "./pages/Streamers.jsx";
import { AuthCompletePage, LoginPage, LogoutPage } from "./pages/AuthPages.jsx";
import PlayerDashboard from "./pages/PlayerDashboard.jsx";
import AccountSettingsPage from "./pages/AccountSettingsPage.jsx";
import AdminsPage from "./pages/AdminsPage.jsx";
import MaintenanceSettingsPage from "./pages/MaintenanceSettingsPage.jsx";
import { AdminWorkspace } from "./pages/AdminWorkspace.jsx";
import GtaMapPage from "./pages/GtaMapPage.jsx";
import AdminMapPage from "./pages/AdminMapPage.jsx";
import AdminTicketManager from "./components/AdminTicketManager.jsx";
import MediaLibraryPage from "./pages/MediaLibraryPage.jsx";
import MaintenanceScreen from "./components/MaintenanceScreen.jsx";
import { ForbiddenPage, NotFoundPage } from "./pages/SystemPages.jsx";
import { PublicLayout } from "./components/PublicLayout.jsx";
import { DashboardLayout } from "./components/DashboardLayout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { useApp } from "./context/AppContext.jsx";

function Guarded({ permission, children }) {
  return <ProtectedRoute permission={permission}>{children}</ProtectedRoute>;
}

function maintenanceIsActive(settings = {}) {
  if (!settings.maintenanceMode) return false;
  const endAt = settings.maintenanceEndsAt ? new Date(settings.maintenanceEndsAt).getTime() : 0;
  if (endAt && Number.isFinite(endAt) && endAt <= Date.now()) return false;
  return true;
}

function canBypassMaintenance(user) {
  const permissions = user?.permissions || [];
  return permissions.includes("master_access") || permissions.includes("manage_home") || permissions.includes("manage_theme");
}

export default function App() {
  const { settings, user } = useApp();
  const location = useLocation();
  const authMaintenancePath = ["/login", "/auth/complete", "/logout"].includes(location.pathname);
  const maintenance = maintenanceIsActive(settings) && !canBypassMaintenance(user) && !authMaintenancePath;

  if (maintenance) return <MaintenanceScreen settings={settings} />;

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage mode="register" />} />
          <Route path="/auth/complete" element={<AuthCompletePage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/roster" element={<StreamersPage />} />
          <Route path="/roster/:id" element={<StreamerDetail />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/team" element={<PublicCollection type="team" />} />
          <Route path="/team/:id" element={<PublicDetail type="team" />} />
          <Route path="/careers" element={<PublicCollection type="careers" />} />
          <Route path="/careers/:id" element={<CareerDetailPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/news" element={<PublicCollection type="news" />} />
          <Route path="/news/:id" element={<PublicDetail type="news" />} />
          <Route path="/map" element={<GtaMapPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/events" element={<PublicCollection type="events" />} />
          <Route path="/events/:id" element={<PublicDetail type="events" />} />
          <Route path="/journey" element={<PublicCollection type="journey" />} />
          <Route path="/journey/:id" element={<PublicDetail type="journey" />} />
          <Route path="/famous" element={<PublicCollection type="famous" />} />
          <Route path="/famous/:id" element={<PublicDetail type="famous" />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route path="/account" element={<Guarded permission="view_player_portal"><PlayerDashboard /></Guarded>} />
          <Route path="/account/characters" element={<Guarded permission="view_player_portal"><PlayerDashboard section="characters" /></Guarded>} />
          <Route path="/account/tickets" element={<Guarded permission="view_player_portal"><PlayerDashboard section="tickets" /></Guarded>} />
          <Route path="/account/applications" element={<Guarded permission="view_player_portal"><PlayerDashboard section="applications" /></Guarded>} />
          <Route path="/account/settings" element={<Guarded permission="view_player_portal"><AccountSettingsPage /></Guarded>} />
          <Route path="/admin" element={<Guarded permission="manage_home"><AdminWorkspace /></Guarded>} />
          <Route path="/admin/settings" element={<Guarded permission="manage_home"><AdminWorkspace section="settings" /></Guarded>} />
          <Route path="/admin/maintenance" element={<Guarded permission="manage_home"><MaintenanceSettingsPage /></Guarded>} />
          <Route path="/admin/home" element={<Guarded permission="manage_home"><AdminWorkspace section="home" /></Guarded>} />
          <Route path="/admin/partners" element={<Guarded permission="manage_partners"><AdminWorkspace section="partners" /></Guarded>} />
          <Route path="/admin/journey" element={<Guarded permission="manage_journey"><AdminWorkspace section="journey" /></Guarded>} />
          <Route path="/admin/famous" element={<Guarded permission="manage_famous"><AdminWorkspace section="famous" /></Guarded>} />
          <Route path="/admin/roster" element={<Guarded permission="manage_roster"><AdminWorkspace section="roster" /></Guarded>} />
          <Route path="/admin/live" element={<Guarded permission="manage_live"><AdminWorkspace section="live" /></Guarded>} />
          <Route path="/admin/team" element={<Guarded permission="manage_team"><AdminWorkspace section="team" /></Guarded>} />
          <Route path="/admin/careers" element={<Guarded permission="manage_careers"><AdminWorkspace section="careers" /></Guarded>} />
          <Route path="/admin/careers/:id/applications" element={<Guarded permission="review_career_applications"><AdminWorkspace section="careers" resourceOverride="careerApplications" /></Guarded>} />
          <Route path="/admin/tickets" element={<Guarded permission="manage_tickets"><AdminTicketManager /></Guarded>} />
          <Route path="/admin/news" element={<Guarded permission="manage_news"><AdminWorkspace section="news" /></Guarded>} />
          <Route path="/admin/map" element={<Guarded permission="manage_map"><AdminMapPage /></Guarded>} />
          <Route path="/admin/faq" element={<Guarded permission="manage_faq"><AdminWorkspace section="faq" /></Guarded>} />
          <Route path="/admin/terms" element={<Guarded permission="manage_terms"><AdminWorkspace section="terms" /></Guarded>} />
          <Route path="/admin/events" element={<Guarded permission="manage_events"><AdminWorkspace section="events" /></Guarded>} />
          <Route path="/admin/users" element={<Guarded permission="manage_users"><AdminWorkspace section="users" /></Guarded>} />
          <Route path="/admin/admins" element={<Guarded permission="manage_admins"><AdminsPage /></Guarded>} />
          <Route path="/admin/permissions" element={<Guarded permission="manage_permissions"><AdminWorkspace section="permissions" /></Guarded>} />
          <Route path="/admin/webhooks" element={<Guarded permission="manage_webhooks"><AdminWorkspace section="webhooks" /></Guarded>} />
          <Route path="/admin/audit-logs" element={<Guarded permission="view_audit_logs"><AdminWorkspace section="audit-logs" /></Guarded>} />
          <Route path="/admin/theme" element={<Guarded permission="manage_theme"><AdminWorkspace section="theme" /></Guarded>} />
          <Route path="/admin/media" element={<Guarded permission="manage_home"><MediaLibraryPage /></Guarded>} />
          <Route path="/dashboard" element={<Navigate to="/account" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
