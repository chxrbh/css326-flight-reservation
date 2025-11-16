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
  status: "on-time" | "delayed" | "cancelled";
  delayed_min: number | null;
  max_sellable_seat: number | null;
  flight_no: string;
  airline_id: number;
  airline_name: string;
  airline_code: string;
  origin_code: string;
  dest_code: string;
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

export function useFlightInstances() {
  return useQuery<FlightInstance[]>({
    queryKey: ["flight-instances"],
    queryFn: () => api("/flight-instances"),
  });
}

export function useCreateFlightInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      flight_id: number;
      status?: "on-time" | "delayed" | "cancelled";
      departure_datetime: string; // ISO local -> server expects MySQL-compatible string
      arrival_datetime: string;
    }) =>
      api("/flight-instances", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["flight-instances"] });
      const prev = qc.getQueryData<FlightInstance[]>(["flight-instances"]);
      const temp: any = {
        instance_id: Date.now(),
        flight_id: vars.flight_id,
        departure_datetime: vars.departure_datetime,
        arrival_datetime: vars.arrival_datetime,
        status: (vars.status || "on-time") as any,
        delayed_min: 0,
        max_sellable_seat: null,
        flight_no: "",
        airline_name: "",
        airline_code: "",
        origin_code: "",
        dest_code: "",
      } as FlightInstance;
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
          const targetDelay =
            vars.status === "delayed" ? vars.delayed_min ?? 0 : 0;
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
