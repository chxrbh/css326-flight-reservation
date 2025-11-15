import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useUpdatePassengerProfile(accountId?: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      first_name: string;
      last_name: string;
      gender?: string | null;
      dob?: string | null;
      phone?: string | null;
      nationality?: string | null;
    }) =>
      api(`/auth/profile/${accountId}/passenger`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", accountId] });
    },
  });
}

export function useUpdateAirlineAdminProfile(accountId?: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      first_name: string;
      last_name: string;
      hire_date?: string | null;
    }) =>
      api(`/auth/profile/${accountId}/airline-admin`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", accountId] });
    },
  });
}
