import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Reservation = {
  ticket_id: number;
  ticket_no: string;
  booking_date: string | null;
  status: "booked" | "checked-In" | "cancelled";
  seat: string | null;
  price_usd: string | null;
  passenger_id: number;
  first_name: string | null;
  last_name: string | null;
  instance_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  flight_no: string;
  airline_name: string;
  airline_code: string;
  origin_code: string;
  origin_name: string | null;
  destination_code: string;
  destination_name: string | null;
};

export function useReservations() {
  return useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: () => api("/reservations"),
  });
}

export function useBookReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { instance_id: number; passenger_id?: number }) =>
      api("/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}
