import { useState } from "react";

export default function AddUser({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch((import.meta as any).env.VITE_API_URL + "/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    if (!res.ok) {
      alert("Failed: " + (await res.text()));
      return;
    }
    setName(""); setEmail("");
    onCreated?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        className="border rounded-xl p-2"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        className="border rounded-xl p-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button className="rounded-2xl bg-black text-white px-4 py-2">
        Add User
      </button>
    </form>
  );
}
