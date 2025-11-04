import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Airport = {
  airport_id: number;
  airport_iata_code: string;
  name: string | null;
  city: string | null;
  country: string | null;
};

export function useAirports() {
  return useQuery<Airport[]>({
    queryKey: ["airports"],
    queryFn: () => api("/airports"),
  });
}

