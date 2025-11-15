import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const mapAdmin = (row: any) => ({
  id: row.account_id,
  employeeId: row.employee_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  airlineId: row.airline_id,
  airlineName: row.airline_name,
  airlineCode: row.airline_code,
  hireDate: row.hire_date,
});

export function useAirlineAdmins() {
  return useQuery({
    queryKey: ["airline-admins"],
    queryFn: async () => {
      const rows = await api("/airline-admins");
      return rows.map(mapAdmin);
    },
  });
}

export function useCreateAirlineAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      airline_id: number;
    }) =>
      api("/airline-admins", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airline-admins"] });
    },
  });
}

export function useDeleteAirlineAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) =>
      api(`/airline-admins/${accountId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airline-admins"] });
    },
  });
}
