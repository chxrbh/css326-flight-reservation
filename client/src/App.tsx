import { useEffect, useState } from "react";
import Airlines from "@/pages/Airlines";
import Flight from "@/pages/Flight";
import FlightsSearch from "@/pages/FlightsSearch";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

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
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Routes>
            <Route path="/" element={<Navigate to="/airlines" replace />} />
            <Route path="/airlines" element={<Airlines />} />
            <Route path="/flight" element={<Flight />} />
            <Route path="/flight-search" element={<FlightsSearch />} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
