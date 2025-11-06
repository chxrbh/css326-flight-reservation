import { useEffect, useState } from "react";
import Airlines from "@/pages/Airlines";
import Flight from "@/pages/Flight";
import FlightsSearch from "@/pages/FlightsSearch";
import Reservation from "@/pages/Reservation";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthStatus from "@/components/AuthStatus";

type User = { id: number; name: string; email: string };

export default function App() {
  // const [users, setUsers] = useState<User[]>([]);
  // const [loading, setLoading] = useState(true);

  // async function refresh() {
  //   setLoading(true);
  //   const res = await fetch(
  //     (import.meta as any).env.VITE_API_URL + "/api/users"
  //   );
  //   const data = await res.json();
  //   setUsers(data);
  //   setLoading(false);
  // }

  // useEffect(() => {
  //   refresh();
  // }, []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white border-b">
              <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">
                    Flight Reservation
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Protected routes by access type
                  </div>
                </div>
                <AuthStatus />
              </div>
            </header>
            <main>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/flight-search" replace />}
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
                  path="/flight-search"
                  element={
                    <ProtectedRoute
                      allowed={["passenger", "airline-admin", "super-admin"]}
                    >
                      <FlightsSearch />
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
