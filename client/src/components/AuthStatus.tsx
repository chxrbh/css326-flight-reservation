import { mockAccounts } from "@/data/mockAccounts";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";

export default function AuthStatus() {
  const { account, login } = useAuth();

  return (
    <div className="flex flex-col gap-1 text-sm">
      <Label htmlFor="account-select" className="text-xs uppercase text-[#D1E2E6]">
        Active Account
      </Label>
      <select
        id="account-select"
        className="border rounded-md px-3 py-2 bg-white text-sm"
        value={account?.id ?? ""}
        onChange={(event) => login(Number(event.target.value))}
      >
        {mockAccounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name} — {acc.access_type}
          </option>
        ))}
      </select>
    </div>
  );
}
