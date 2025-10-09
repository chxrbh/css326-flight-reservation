import { useEffect, useState } from "react";
import Airlines from "@/pages/Airlines";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type User = { id: number; name: string; email: string };

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="p-6 shadow bg-white">
          <h1 className="text-2xl font-bold">
            Vite + React + Tailwind + MySQL
          </h1>
        </header>

        <main className="p-6 space-y-6">
          <div className="text-sm text-gray-600">
            API: {(import.meta as any).env.VITE_API_URL}
          </div>

          <Airlines />

          {loading ? (
            <p className="animate-pulse">Loading users…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((u) => (
                <div key={u.id} className="rounded-2xl border p-4 bg-white">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}
