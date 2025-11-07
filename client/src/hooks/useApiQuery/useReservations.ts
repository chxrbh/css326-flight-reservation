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
  flight_id: number;
  flight_no: string;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  origin_code: string;
  origin_name: string | null;
  destination_code: string;
  destination_name: string | null;
};

export type ReservationFilters = {
  airlineId?: number;
  flightId?: number;
  passengerId?: number;
};

export function useReservations(filters?: ReservationFilters) {
  const airlineId = filters?.airlineId ?? null;
  const flightId = filters?.flightId ?? null;
  const passengerId = filters?.passengerId ?? null;
  return useQuery<Reservation[]>({
    queryKey: ["reservations", airlineId, flightId, passengerId],
    queryFn: () => {
      const search = new URLSearchParams();
      if (airlineId) {
        search.set("airline_id", String(airlineId));
      }
      if (flightId) {
        search.set("flight_id", String(flightId));
      }
      if (passengerId) {
        search.set("passenger_id", String(passengerId));
      }
      const query = search.toString();
      return api(`/reservations${query ? `?${query}` : ""}`);
    },
  });
}

export function useBookReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { instance_id: number; passenger_id: number }) =>
      api("/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      ticket_id: number;
      status: Reservation["status"];
      seat?: string;
    }) =>
      api(`/reservations/${payload.ticket_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: payload.status,
          seat: payload.seat,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}
