import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AirlineAdminProfile = {
  account_id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  hire_date: string | null;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  email: string;
};

export function useAirlineAdminProfile(accountId: number | null | undefined) {
  return useQuery<AirlineAdminProfile>({
    queryKey: ["airline-admin-profile", accountId],
    enabled: Boolean(accountId),
    queryFn: () => api(`/airline-admins/profile/${accountId}`),
  });
}

type AirlineAdminProfileInput = {
  first_name: string;
  last_name: string;
  hire_date?: string | null;
};

export function useUpdateAirlineAdminProfile(
  accountId: number | null | undefined
) {
  const queryClient = useQueryClient();
  return useMutation<AirlineAdminProfile, Error, AirlineAdminProfileInput>({
    mutationFn: (payload) => {
      if (!accountId) {
        return Promise.reject(new Error("Account ID is required"));
      }
      return api(`/airline-admins/profile/${accountId}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: payload.first_name,
          last_name: payload.last_name,
          hire_date:
            typeof payload.hire_date === "string"
              ? payload.hire_date
              : null,
        }),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["airline-admin-profile", accountId],
        updated
      );
    },
  });
}
