import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { AccessType } from "@/types/auth";

type ProtectedRouteProps = {
  allowed: AccessType[];
  fallbackPath?: string;
  children: React.ReactNode;
};

export default function ProtectedRoute({
  allowed,
  fallbackPath = "/search",
  children,
}: ProtectedRouteProps) {
  const { account, accessType } = useAuth();
  const location = useLocation();

  if (!account || !accessType) {
    return (
      <Navigate to="/auth" replace state={{ from: location }} />
    );
  }

  if (!allowed.includes(accessType)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
