import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import { PublicCollection, PublicDetail } from "./pages/PublicCollection.jsx";
import { StreamerDetail, StreamersPage } from "./pages/Streamers.jsx";
import { LoginPage, LogoutPage, SelectLanguagePage } from "./pages/AuthPages.jsx";
import { RulesPage, TermsPage } from "./pages/RulesTerms.jsx";
import StatusPage from "./pages/StatusPage.jsx";
import { ApplyPage, BanAppealPage, TicketsPage } from "./pages/Forms.jsx";
import PlayerDashboard from "./pages/PlayerDashboard.jsx";
import { PermissionsPage, SettingsPage, StaffDashboard, StaffResourcePage, StreamerEditor } from "./pages/AdminWorkspace.jsx";
import DomainWorkspace from "./pages/DomainWorkspace.jsx";
import { ForbiddenPage, MaintenancePage, NotFoundPage } from "./pages/SystemPages.jsx";
import { PublicLayout } from "./components/PublicLayout.jsx";
import { DashboardLayout } from "./components/DashboardLayout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useApp } from "./context/AppContext.jsx";

function Guarded({ permission, children }) {
  return <ProtectedRoute permission={permission}>{children}</ProtectedRoute>;
}

export default function App() {
  const { settings, user } = useApp();
  const maintenance = settings.maintenanceMode && !user?.permissions?.includes("master_access");

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={maintenance ? <MaintenancePage /> : <Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/select-language" element={<SelectLanguagePage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/news" element={<PublicCollection type="news" />} />
        <Route path="/news/:id" element={<PublicDetail type="news" />} />
        <Route path="/events" element={<PublicCollection type="events" />} />
        <Route path="/events/:id" element={<PublicDetail type="events" />} />
        <Route path="/businesses" element={<PublicCollection type="businesses" />} />
        <Route path="/businesses/:id" element={<PublicDetail type="businesses" />} />
        <Route path="/map" element={<PublicCollection type="map" />} />
        <Route path="/jobs" element={<PublicCollection type="jobs" />} />
        <Route path="/jobs/:id" element={<PublicDetail type="jobs" />} />
        <Route path="/characters" element={<PublicCollection type="characters" />} />
        <Route path="/characters/:id" element={<PublicDetail type="characters" />} />
        <Route path="/streamers" element={<StreamersPage />} />
        <Route path="/streamers/:id" element={<StreamerDetail />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/ban-appeal" element={<BanAppealPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/archive" element={<PublicCollection type="archive" />} />
        <Route path="/archive/:week" element={<PublicDetail type="archive" />} />
        <Route path="/story" element={<PublicCollection type="story" />} />
        <Route path="/story/:campaign" element={<PublicDetail type="story" />} />
        <Route path="/shop" element={<PublicCollection type="shop" />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/player/dashboard" element={<Guarded permission="view_player_portal"><PlayerDashboard /></Guarded>} />
        <Route path="/player/characters" element={<Guarded permission="view_player_portal"><PlayerDashboard section="characters" /></Guarded>} />
        <Route path="/player/vehicles" element={<Guarded permission="view_player_portal"><PlayerDashboard section="characters" /></Guarded>} />
        <Route path="/player/tickets" element={<Guarded permission="view_player_portal"><PlayerDashboard section="tickets" /></Guarded>} />
        <Route path="/player/appeals" element={<Guarded permission="view_player_portal"><PlayerDashboard section="appeals" /></Guarded>} />
        <Route path="/player/profile" element={<Guarded permission="view_player_portal"><PlayerDashboard section="profile" /></Guarded>} />

        <Route path="/staff/dashboard" element={<Guarded permission="use_staff_panel"><StaffDashboard /></Guarded>} />
        <Route path="/staff/search" element={<Guarded permission="use_staff_panel"><StaffResourcePage resource="logs" /></Guarded>} />
        <Route path="/staff/players/:id" element={<Guarded permission="use_staff_panel"><StaffResourcePage resource="logs" /></Guarded>} />
        <Route path="/staff/tickets" element={<Guarded permission="review_tickets"><StaffResourcePage resource="tickets" /></Guarded>} />
        <Route path="/staff/ban-appeals" element={<Guarded permission="review_ban_appeals"><StaffResourcePage resource="ban-appeals" /></Guarded>} />
        <Route path="/staff/whitelist" element={<Guarded permission="review_whitelist"><StaffResourcePage resource="whitelist" /></Guarded>} />
        <Route path="/staff/logs" element={<Guarded permission="view_audit_logs"><StaffResourcePage resource="logs" /></Guarded>} />
        <Route path="/staff/settings" element={<Guarded permission="edit_website_settings"><SettingsPage /></Guarded>} />
        <Route path="/staff/permissions" element={<Guarded permission="manage_admins"><PermissionsPage /></Guarded>} />
        <Route path="/staff/cms" element={<Guarded permission="edit_website_settings"><StaffResourcePage resource="cms" /></Guarded>} />
        <Route path="/staff/streamers" element={<Guarded permission="manage_streamers"><StaffResourcePage resource="streamers" /></Guarded>} />
        <Route path="/staff/streamers/create" element={<Guarded permission="manage_streamers"><StreamerEditor mode="create" /></Guarded>} />
        <Route path="/staff/streamers/:id/edit" element={<Guarded permission="manage_streamers"><StreamerEditor mode="edit" /></Guarded>} />

        <Route path="/police/dashboard" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" /></Guarded>} />
        <Route path="/police/search" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="search" /></Guarded>} />
        <Route path="/police/citizen/:id" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="search" /></Guarded>} />
        <Route path="/police/reports" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="reports" /></Guarded>} />
        <Route path="/police/warrants" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="warrants" /></Guarded>} />
        <Route path="/police/fines" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="fines" /></Guarded>} />
        <Route path="/police/callsigns" element={<Guarded permission="view_police_panel"><DomainWorkspace domain="police" page="callsigns" /></Guarded>} />

        <Route path="/ems/dashboard" element={<Guarded permission="view_ems_panel"><DomainWorkspace domain="ems" /></Guarded>} />
        <Route path="/ems/search" element={<Guarded permission="view_ems_panel"><DomainWorkspace domain="ems" page="search" /></Guarded>} />
        <Route path="/ems/patient/:id" element={<Guarded permission="view_ems_panel"><DomainWorkspace domain="ems" page="search" /></Guarded>} />
        <Route path="/ems/reports" element={<Guarded permission="view_ems_panel"><DomainWorkspace domain="ems" page="reports" /></Guarded>} />

        <Route path="/court/dashboard" element={<Guarded permission="view_court_panel"><DomainWorkspace domain="court" /></Guarded>} />
        <Route path="/court/cases" element={<Guarded permission="view_court_panel"><DomainWorkspace domain="court" page="cases" /></Guarded>} />
        <Route path="/court/cases/:id" element={<Guarded permission="view_court_panel"><DomainWorkspace domain="court" page="cases" /></Guarded>} />
        <Route path="/court/documents" element={<Guarded permission="view_court_panel"><DomainWorkspace domain="court" page="documents" /></Guarded>} />

        <Route path="/business-owner/dashboard" element={<Guarded permission="manage_business"><DomainWorkspace domain="business-owner" /></Guarded>} />
        <Route path="/business-owner/business/:id" element={<Guarded permission="manage_business"><DomainWorkspace domain="business-owner" /></Guarded>} />
        <Route path="/gang/dashboard" element={<Guarded permission="manage_gang"><DomainWorkspace domain="gang" /></Guarded>} />
        <Route path="/gang/:id" element={<Guarded permission="manage_gang"><DomainWorkspace domain="gang" /></Guarded>} />

        <Route path="/dashboard" element={<Navigate to="/player/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
