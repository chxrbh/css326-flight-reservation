import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { AccessType } from "@/data/mockAccounts";

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

  if (!account || !accessType || !allowed.includes(accessType)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
