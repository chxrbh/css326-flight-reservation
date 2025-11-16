import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type {
  AccessType,
  AuthAccount,
  PassengerRecord,
  SignInResponse,
} from "@/types/auth";

type AuthSession = {
  account: AuthAccount;
  passenger: PassengerRecord | null;
};

type AuthContextValue = {
  account: AuthAccount | null;
  passenger: PassengerRecord | null;
  accessType: AccessType | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePassenger: (passenger: PassengerRecord | null) => void;
};

const STORAGE_KEY = "auth_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

function mapAccount(
  account: SignInResponse["account"],
  passenger: PassengerRecord | null
): AuthAccount {
  const fullName =
    passenger && (passenger.first_name || passenger.last_name)
      ? `${passenger.first_name ?? ""} ${passenger.last_name ?? ""}`.trim()
      : null;

  return {
    id: account.account_id,
    email: account.email,
    access_type: account.access_type,
    airline_id:
      typeof account.airline_id === "number" ? account.airline_id : null,
    passenger_id: passenger?.passenger_id ?? null,
    name: fullName && fullName.length > 0 ? fullName : account.email,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthSession;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  type SessionState = AuthSession | null;

  const persistSession = useCallback(
    (next: SessionState | ((prev: SessionState) => SessionState)) => {
      setSession((prev) => {
        const value =
          typeof next === "function" ? (next as (p: SessionState) => SessionState)(prev) : next;
        if (typeof window !== "undefined") {
          if (value) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
        return value;
      });
    },
    []
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const result = await api<SignInResponse>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const authAccount = mapAccount(result.account, result.passenger);
      persistSession({ account: authAccount, passenger: result.passenger });
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const updatePassenger = useCallback(
    (nextPassenger: PassengerRecord | null) => {
      persistSession((prev) => {
        if (!prev) return prev;
        const fullName =
          nextPassenger && (nextPassenger.first_name || nextPassenger.last_name)
            ? `${nextPassenger.first_name ?? ""} ${
                nextPassenger.last_name ?? ""
              }`.trim()
            : null;
        return {
          account: {
            ...prev.account,
            passenger_id: nextPassenger?.passenger_id ?? null,
            name: fullName && fullName.length > 0 ? fullName : prev.account.email,
          },
          passenger: nextPassenger,
        };
      });
    },
    [persistSession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      account: session?.account ?? null,
      passenger: session?.passenger ?? null,
      accessType: session?.account.access_type ?? null,
      login,
      logout,
      updatePassenger,
    }),
    [session, login, logout, updatePassenger]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
