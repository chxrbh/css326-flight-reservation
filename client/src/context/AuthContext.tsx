import React, { createContext, useContext, useMemo, useState } from "react";
import { mockAccounts, type MockAccount, type AccessType } from "@/data/mockAccounts";

type AuthContextValue = {
  account: MockAccount | null;
  accessType: AccessType | null;
  login: (accountId: number) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accountId, setAccountId] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("account_id") : null;
    return stored ? Number(stored) : mockAccounts[0].id;
  });

  const account = mockAccounts.find((acc) => acc.id === accountId) ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      accessType: account?.access_type ?? null,
      login: (id: number) => {
        const exists = mockAccounts.find((acc) => acc.id === id);
        if (exists) {
          setAccountId(id);
          localStorage.setItem("account_id", String(id));
        }
      },
      logout: () => {
        setAccountId(mockAccounts[0].id);
        localStorage.removeItem("account_id");
      },
    }),
    [account]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
