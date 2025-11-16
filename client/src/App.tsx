import Airlines from "@/pages/Airlines";
import Flight from "@/pages/Flight";
import FlightsSearch from "@/pages/FlightsSearch";
import Reservation from "@/pages/Reservation";
import AuthPage from "@/pages/Auth";
import AirlineAccounts from "@/pages/AirlineAccounts";
import Profile from "@/pages/Profile";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthStatus from "@/components/AuthStatus";
import RoleNav from "@/components/RoleNav";

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-[#18599E] border-b">
              <div className="max-w-6xl mx-auto px-6 py-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      Flight Reservation
                    </div>
                    <div className="text-xs text-[#CAD1E3]">
                      Protected routes by access type
                    </div>
                  </div>
                  <AuthStatus />
                </div>
                <RoleNav />
              </div>
            </header>
            <main>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/search" replace />}
                />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/airline-admins"
                  element={
                    <ProtectedRoute allowed={["super-admin"]}>
                      <AirlineAccounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/airlines"
                  element={
                    <ProtectedRoute allowed={["super-admin"]}>
                      <Airlines />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flight"
                  element={
                    <ProtectedRoute allowed={["airline-admin", "super-admin"]}>
                      <Flight />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={<FlightsSearch />}
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowed={["passenger"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservation"
                  element={
                    <ProtectedRoute
                      allowed={["passenger", "airline-admin", "super-admin"]}
                    >
                      <Reservation />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
