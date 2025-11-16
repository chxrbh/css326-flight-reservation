import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PassengerRecord } from "@/types/auth";

export type PassengerProfilePayload = {
  first_name: string;
  last_name: string;
  gender: "M" | "F" | "" | null;
  dob: string | null;
  phone: string | null;
  nationality: string | null;
};

export function usePassengerProfile(passengerId: number | null | undefined) {
  return useQuery<PassengerRecord>({
    queryKey: ["passenger-profile", passengerId],
    enabled: Boolean(passengerId),
    queryFn: () => api(`/passengers/${passengerId}`),
  });
}

export function useUpdatePassengerProfile(
  passengerId: number | null | undefined
) {
  const qc = useQueryClient();

  return useMutation<PassengerRecord, Error, PassengerProfilePayload>({
    mutationFn: (payload) =>
      passengerId
        ? api(`/passengers/${passengerId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : Promise.reject(new Error("Passenger ID is required")),
    onSuccess: (updated) => {
      qc.setQueryData(["passenger-profile", passengerId], updated);
    },
  });
}
