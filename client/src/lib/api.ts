const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function api<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// example calls
// export const FlightsAPI = {
//   list: (
//     params: { date?: string; origin?: string; destination?: string } = {}
//   ) => {
//     const q = new URLSearchParams(params as any).toString();
//     return api(`/flights${q ? `?${q}` : ""}`);
//   },
// };

// export const AuthAPI = {
//   login: (email: string, password: string) =>
//     api<{ token: string }>(`/auth/login`, {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//     }),
//   register: (email: string, password: string, full_name?: string) =>
//     api(`/auth/register`, {
//       method: "POST",
//       body: JSON.stringify({ email, password, full_name }),
//     }),
// };
