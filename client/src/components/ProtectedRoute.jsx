import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { Card } from "./Card.jsx";

export function ProtectedRoute({ permission, children }) {
  const { user, loading, hasPermission } = useApp();
  if (loading) return <Card><div className="h-24 rounded-lg skeleton" /></Card>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/403" replace />;
  return children;
}
