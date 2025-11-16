import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type FlightSchedule = {
  flight_id: number;
  flight_no: string;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  origin_code: string;
  dest_code: string;
  duration?: string | null;
  status: string;
};

export type FlightInstance = {
  instance_id: number;
  flight_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  price_usd: number;
  status: "on-time" | "delayed" | "cancelled";
  delayed_min: number | null;
  max_sellable_seat: number | null;
  flight_no: string;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  origin_airport_id: number;
  origin_code: string;
  dest_code: string;
  gate_id: number | null;
  gate_code: string | null;
  gate_assignment_start: string | null;
  gate_assignment_end: string | null;
};

export type GateOption = {
  gate_id: number;
  gate_code: string | null;
  status: "active" | "closed" | "maintenance";
  is_available: boolean;
};

export type GateOptionsResponse = {
  instance_id: number;
  origin_airport_id: number;
  current_gate_id: number | null;
  occupy_start_utc: string | null;
  occupy_end_utc: string | null;
  gates: GateOption[];
};

export function useFlightSchedules() {
  return useQuery<FlightSchedule[]>({
    queryKey: ["flight-schedules"],
    queryFn: () => api("/flight-schedules"),
  });
}

export function useEachFlightSchedules(id: number) {
  return useQuery<FlightSchedule>({
    queryKey: ["flight-schedule", id],
    queryFn: () => api(`/flight-schedules/${id}`),
    enabled: !!id, // prevents running if id is undefined/null
  });
}

export function useFlightInstances(params?: {
  status?: FlightInstance["status"][];
}) {
  return useQuery<FlightInstance[]>({
    queryKey: ["flight-instances", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status.length) {
        searchParams.set("status", params.status.join(","));
      }
      const suffix = searchParams.toString();
      return api(`/flight-instances${suffix ? `?${suffix}` : ""}`);
    },
  });
}

export function useCreateFlightInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      flight_id: number;
      price_usd: number;
      status?: "on-time" | "delayed" | "cancelled";
      departure_datetime: string; // UTC ISO string
      arrival_datetime: string;
    }) =>
      api("/flight-instances", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["flight-instances"] });
      const prev = qc.getQueryData<FlightInstance[]>(["flight-instances"]);
      const temp: FlightInstance = {
        instance_id: Date.now(),
        flight_id: vars.flight_id,
        departure_datetime: vars.departure_datetime,
        arrival_datetime: vars.arrival_datetime,
        price_usd: vars.price_usd,
        status: (vars.status || "on-time") as FlightInstance["status"],
        delayed_min: 0,
        max_sellable_seat: null,
        flight_no: "",
        airline_id: 0,
        airline_name: "",
        airline_code: "",
        origin_airport_id: 0,
        origin_code: "",
        dest_code: "",
        gate_id: null,
        gate_code: null,
        gate_assignment_start: null,
        gate_assignment_end: null,
      };
      qc.setQueryData<FlightInstance[]>(["flight-instances"], (old) => [
        ...(old ?? []),
        temp,
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["flight-instances"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["flight-instances"] }),
  });
}

export function useUpdateFlightInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      instance_id: number;
      status: "on-time" | "delayed" | "cancelled";
      delayed_min?: number;
    }) =>
      api(`/flight-instances/${payload.instance_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["flight-instances"] });
      const prev = qc.getQueryData<FlightInstance[]>(["flight-instances"]);
      qc.setQueryData<FlightInstance[]>(["flight-instances"], (old) =>
        (old ?? []).map((it) => {
          if (it.instance_id !== vars.instance_id) return it;
          const scheduled =
            adjustMinutes(it.arrival_datetime, -(it.delayed_min ?? 0)) ??
            it.arrival_datetime;
          const requestedDelay =
            vars.status === "delayed" && typeof vars.delayed_min === "number"
              ? vars.delayed_min
              : 0;
          const targetDelay =
            requestedDelay && requestedDelay > 0 ? requestedDelay : 0;
          const newArrival =
            adjustMinutes(scheduled, targetDelay) ?? it.arrival_datetime;
          return {
            ...it,
            status: vars.status,
            delayed_min: targetDelay,
            arrival_datetime: newArrival,
          };
        })
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["flight-instances"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["flight-instances"] }),
  });
}

export function useGateOptions(instanceId: number | null) {
  return useQuery<GateOptionsResponse>({
    queryKey: ["gate-options", instanceId],
    enabled: Boolean(instanceId),
    queryFn: () => api(`/flight-instances/${instanceId}/gates`),
    staleTime: 1000 * 15,
  });
}

export function useUpdateGateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { instance_id: number; gate_id: number }) =>
      api(`/flight-instances/${payload.instance_id}/gate`, {
        method: "PUT",
        body: JSON.stringify({ gate_id: payload.gate_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flight-instances"] });
      qc.invalidateQueries({ queryKey: ["gate-options"] });
    },
  });
}

function adjustMinutes(input: string, minutes: number) {
  if (!input || typeof minutes !== "number" || Number.isNaN(minutes)) {
    return null;
  }
  const normalized = input.includes("T") ? input : input.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function useCreateFlightSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      flight_no: string;
      origin_airport_id: number;
      destination_airport_id: number;
      aircraft_type?: string;
      duration?: string; // HH:MM:SS
      airline_id: number;
    }) =>
      api("/flight-schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["flight-schedules"] }),
  });
}
