import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type FlightSearchParams = {
  originAirportId?: number;
  destinationAirportId?: number;
  departureDate?: string;
};

export type FlightSearchResult = {
  instance_id: number;
  flight_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  max_sellable_seat: number | null;
  status: "on-time" | "delayed" | "cancelled";
  delayed_min: number | null;
  flight_no: string;
  airline_name: string;
  airline_code: string;
  origin_airport_id: number;
  origin_code: string;
  origin_name: string | null;
  destination_airport_id: number;
  destination_code: string;
  destination_name: string | null;
};

export function useFlightSearch(params: FlightSearchParams | null) {
  return useQuery<FlightSearchResult[]>({
    queryKey: ["search", params],
    queryFn: () => {
      const search = new URLSearchParams();

      if (params?.originAirportId) {
        search.set("origin_airport_id", String(params.originAirportId));
      }

      if (params?.destinationAirportId) {
        search.set(
          "destination_airport_id",
          String(params.destinationAirportId)
        );
      }

      if (params?.departureDate) {
        search.set("departure_date", params.departureDate);
      }

      const query = search.toString();
      return api<FlightSearchResult[]>(
        `/search${query ? `?${query}` : ""}`
      );
    },
    enabled: !!params,
    staleTime: 1000 * 30,
  });
}
