import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type ProfileResponse = {
  account: {
    account_id: number;
    email: string;
    access_type: string;
  };
  passenger: {
    passenger_id: number;
    first_name: string | null;
    last_name: string | null;
    gender?: string | null;
    dob?: string | null;
    phone?: string | null;
    nationality?: string | null;
  } | null;
  airlineAdmin: {
    employee_id: number;
    first_name: string | null;
    last_name: string | null;
    hire_date: string | null;
    airline_id: number;
    airline_name: string;
    airline_code: string;
  } | null;
};

export function useProfile(accountId?: number | null) {
  return useQuery<ProfileResponse>({
    queryKey: ["profile", accountId],
    queryFn: () => api(`/auth/profile/${accountId}`),
    enabled: typeof accountId === "number" && accountId > 0,
  });
}
