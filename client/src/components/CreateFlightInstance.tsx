import React, {
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useFlightSchedules,
  useCreateFlightInstance,
  useUpdateFlightInstance,
  useGateOptions,
  useUpdateGateAssignment,
  useScheduleGateOptions,
} from "@/hooks/useApiQuery";
import type { FlightInstance } from "@/hooks/useApiQuery";
import { useAuth } from "@/context/AuthContext";
import {
  addDurationLocal,
  adjustLocalByMinutes,
  fromMySQLDateTime,
  toUtcISOString,
} from "@/lib/datetime";

type InstanceHandle = {
  openWith: (data: FlightInstance) => void;
};

type InstanceFormState = {
  instance_id: number | null;
  flight_id: string;
  status: "on-time" | "delayed" | "cancelled";
  departure_datetime: string;
  arrival_datetime: string;
  price_usd: string;
  delayed_min: string;
};

const createEmptyForm = (): InstanceFormState => ({
  instance_id: null,
  flight_id: "",
  status: "on-time",
  departure_datetime: "",
  arrival_datetime: "",
  price_usd: "",
  delayed_min: "0",
});

const CreateFlightInstance = forwardRef<InstanceHandle>(
  function CreateFlightInstance(_, ref) {
    const { toast } = useToast();
    const { data: schedules = [], isLoading: loadingSchedules } =
      useFlightSchedules();
    const { account, accessType } = useAuth();
    const isAirlineAdmin = accessType === "airline-admin";
    const adminAirlineId = account?.airline_id ?? null;

    const scheduleById = useMemo(() => {
      const map: Record<string, { duration: string | null }> = {};
      for (const s of schedules)
        map[String(s.flight_id)] = { duration: s.duration || null };
      return map;
    }, [schedules]);

    const scheduleOptions = useMemo(() => {
      if (!isAirlineAdmin || !adminAirlineId) return schedules;
      return schedules.filter((s) => s.airline_id === adminAirlineId);
    }, [schedules, isAirlineAdmin, adminAirlineId]);

    const createInstance = useCreateFlightInstance();
    const updateInstance = useUpdateFlightInstance();
    const updateGateAssignment = useUpdateGateAssignment();

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<InstanceFormState>(() => createEmptyForm());
    const [arrivalTouched, setArrivalTouched] = useState(false);
    const [scheduledArrivalLocal, setScheduledArrivalLocal] = useState("");
    const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
    const [initialGateId, setInitialGateId] = useState<number | null>(null);
    const gateOptions = useGateOptions(form.instance_id ?? null);
    const isEditing = Boolean(form.instance_id);
    const creationGateParams = useMemo(() => {
      if (isEditing) {
        return { flightId: null, departureUtc: null };
      }
      const flightIdNum = Number(form.flight_id);
      if (!flightIdNum || Number.isNaN(flightIdNum)) {
        return { flightId: null, departureUtc: null };
      }
      if (!form.departure_datetime) {
        return { flightId: flightIdNum, departureUtc: null };
      }
      return {
        flightId: flightIdNum,
        departureUtc: toUtcISOString(form.departure_datetime),
      };
    }, [isEditing, form.flight_id, form.departure_datetime]);
    const creationGateOptions = useScheduleGateOptions(
      creationGateParams.flightId,
      creationGateParams.departureUtc
    );

    useEffect(() => {
      if (isEditing) return;
      setSelectedGateId(null);
    }, [
      isEditing,
      creationGateParams.flightId,
      creationGateParams.departureUtc,
    ]);

    const resetForm = () => {
      setForm(createEmptyForm());
      setArrivalTouched(false);
      setScheduledArrivalLocal("");
      setSelectedGateId(null);
      setInitialGateId(null);
    };

    const handleDialogToggle = (next: boolean) => {
      setOpen(next);
      if (!next) resetForm();
    };

    useImperativeHandle(ref, () => ({
      openWith(data: FlightInstance) {
        if (!data) return;
        const arrivalLocal = fromMySQLDateTime(data.arrival_datetime);
        const currentDelay = Number(data.delayed_min ?? 0);
        const scheduled = adjustLocalByMinutes(arrivalLocal, -currentDelay);
        setForm({
          instance_id: data.instance_id ?? null,
          flight_id: String(data.flight_id ?? ""),
          status: (data.status as InstanceFormState["status"]) ?? "on-time",
          departure_datetime: fromMySQLDateTime(data.departure_datetime),
          arrival_datetime: arrivalLocal,
          price_usd:
            data.price_usd === undefined || data.price_usd === null
              ? ""
              : String(data.price_usd),
          delayed_min: String(currentDelay || 0),
        });
        setScheduledArrivalLocal(scheduled);
        setSelectedGateId(data.gate_id ?? null);
        setInitialGateId(data.gate_id ?? null);
        setArrivalTouched(false);
        handleDialogToggle(true);
      },
    }));

    const handleSave = async () => {
      if (isEditing) {
        const rawDelay =
          form.status === "delayed" ? Number(form.delayed_min || 0) : undefined;
        if (
          form.status === "delayed" &&
          (rawDelay === undefined || Number.isNaN(rawDelay) || rawDelay <= 0)
        ) {
          toast({
            title: "Invalid delay",
            description: "Provide a positive number of minutes.",
            variant: "destructive",
          });
          return;
        }

        const delayMinutes =
          rawDelay !== undefined && !Number.isNaN(rawDelay) && rawDelay > 0
            ? rawDelay
            : undefined;

        try {
          await updateInstance.mutateAsync({
            instance_id: form.instance_id as number,
            status: form.status,
            delayed_min: delayMinutes,
          });

          const currentGateId =
            gateOptions.data?.current_gate_id ?? initialGateId ?? null;
          const desiredGateId =
            typeof selectedGateId === "number" ? selectedGateId : null;
          if (
            typeof desiredGateId === "number" &&
            desiredGateId !== currentGateId
          ) {
            await updateGateAssignment.mutateAsync({
              instance_id: form.instance_id as number,
              gate_id: desiredGateId,
            });
          }

          toast({
            title: "Updated",
            description: "Flight instance updated.",
          });
          handleDialogToggle(false);
        } catch (e: any) {
          toast({
            title: "Update failed",
            description: e?.message || "Server error",
            variant: "destructive",
          });
        }
        return;
      }

      if (
        !form.flight_id ||
        !form.departure_datetime ||
        !form.arrival_datetime ||
        form.price_usd === ""
      ) {
        toast({
          title: "Missing fields",
          description:
            "Schedule, departure, arrival, and price are required.",
          variant: "destructive",
        });
        return;
      }

      const priceValue = Number(form.price_usd);
      if (Number.isNaN(priceValue) || priceValue < 0) {
        toast({
          title: "Invalid price",
          description: "Enter a valid non-negative price.",
          variant: "destructive",
        });
        return;
      }

      try {
        const createdInstance = await createInstance.mutateAsync({
          flight_id: Number(form.flight_id),
          status: form.status,
          departure_datetime: toUtcISOString(form.departure_datetime),
          arrival_datetime: toUtcISOString(form.arrival_datetime),
          price_usd: priceValue,
        });

        let gateAssignmentError: Error | null = null;
        if (
          typeof selectedGateId === "number" &&
          createdInstance?.instance_id
        ) {
          try {
            await updateGateAssignment.mutateAsync({
              instance_id: createdInstance.instance_id,
              gate_id: selectedGateId,
            });
          } catch (gateErr: any) {
            gateAssignmentError = gateErr instanceof Error ? gateErr : null;
          }
        }

        if (gateAssignmentError) {
          toast({
            title: "Flight created, gate update failed",
            description:
              gateAssignmentError.message ||
              "Gate assignment failed. Edit the instance to try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Created",
            description: "Flight instance created.",
          });
        }
        handleDialogToggle(false);
      } catch (e: any) {
        toast({
          title: "Create failed",
          description: e?.message || "Server error",
          variant: "destructive",
        });
      }
    };

    return (
      <Dialog open={open} onOpenChange={handleDialogToggle}>
        <DialogTrigger asChild>
          <Button>
            <CalendarPlus className="h-4 w-4" /> Create Instance
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.instance_id
                ? "Edit Flight Instance"
                : "Create Flight Instance"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Flight Schedule *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border px-3"
                  value={form.flight_id}
                  disabled={loadingSchedules || isEditing}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((s) => {
                      const dur = scheduleById[v]?.duration || null;
                      const autoArrival = !arrivalTouched
                        ? addDurationLocal(s.departure_datetime, dur)
                        : s.arrival_datetime;
                      return {
                        ...s,
                        flight_id: v,
                        arrival_datetime: autoArrival,
                      };
                    });
                  }}
                >
                  <option value="">
                    {loadingSchedules
                      ? "Loading schedules..."
                      : scheduleOptions.length === 0
                      ? isAirlineAdmin
                        ? "No schedules for your airline"
                        : "No schedules available"
                      : "Select schedule..."}
                  </option>
                  {scheduleOptions.map((s) => (
                    <option key={s.flight_id} value={String(s.flight_id)}>
                      {s.flight_no} - {s.airline_name} ({s.origin_code} →{" "}
                      {s.dest_code})
                    </option>
                  ))}
                </select>
              </div>
              {form.instance_id ? (
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full mt-1 h-10 rounded-md border px-3"
                    value={form.status}
                    onChange={(e) =>
                      setForm((s) => {
                        const nextStatus = e.target.value as
                          | "on-time"
                          | "delayed"
                          | "cancelled";
                        const rawDelay = Number(s.delayed_min || 0);
                        const delayMinutes =
                          nextStatus === "delayed" && rawDelay > 0
                            ? rawDelay
                            : 0;
                        return {
                          ...s,
                          status: nextStatus,
                          delayed_min:
                            nextStatus === "delayed" ? s.delayed_min : "0",
                          arrival_datetime:
                            scheduledArrivalLocal && isEditing
                              ? adjustLocalByMinutes(
                                  scheduledArrivalLocal,
                                  delayMinutes
                                )
                              : s.arrival_datetime,
                        };
                      })
                    }
                  >
                    <option value="on-time">On Time</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ) : null}
              {form.instance_id && form.status === "delayed" ? (
                <div>
                  <Label>Delay (minutes) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.delayed_min}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const minutes = Number(raw || 0);
                      const safeMinutes =
                        Number.isNaN(minutes) || minutes <= 0 ? 0 : minutes;
                      setForm((s) => ({
                        ...s,
                        delayed_min: raw,
                        arrival_datetime:
                          scheduledArrivalLocal && isEditing
                            ? adjustLocalByMinutes(
                                scheduledArrivalLocal,
                                safeMinutes
                              )
                            : s.arrival_datetime,
                      }));
                    }}
                  />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <Label>Gate Assignment</Label>
                {!isEditing && !form.flight_id ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Select a flight schedule to view gate options.
                  </div>
                ) : !isEditing && !form.departure_datetime ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Choose a departure date and time to view gate options.
                  </div>
                ) : (isEditing ? gateOptions.isLoading : creationGateOptions.isLoading) ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Loading gate options...
                  </div>
                ) : (isEditing ? gateOptions.isError : creationGateOptions.isError) ? (
                  <div className="mt-2 text-sm text-destructive">
                    Failed to load gate options.
                  </div>
                ) : (isEditing
                      ? (gateOptions.data?.gates?.length ?? 0) === 0 &&
                        gateOptions.isFetched
                      : (creationGateOptions.data?.gates?.length ?? 0) === 0 &&
                        creationGateOptions.isFetched &&
                        creationGateParams.departureUtc) ? (
                  <div className="mt-2 text-sm text-muted-foreground">
                    No gates available for the origin airport.
                  </div>
                ) : (
                  (isEditing || creationGateParams.departureUtc) && (
                    <select
                      className="w-full mt-1 h-10 rounded-md border px-3"
                      value={selectedGateId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedGateId(val ? Number(val) : null);
                      }}
                    >
                      <option value="">
                        {isEditing
                          ? gateOptions.data?.current_gate_id
                            ? "Keep current gate"
                            : "Select a gate"
                          : "Auto-assign gate"}
                      </option>
                      {(isEditing
                        ? gateOptions.data?.gates ?? []
                        : creationGateOptions.data?.gates ?? []
                      ).map((gate) => {
                        const gateLabel = gate.gate_code
                          ? `Gate ${gate.gate_code}`
                          : `Gate #${gate.gate_id}`;
                        const currentGateId =
                          gateOptions.data?.current_gate_id ?? null;
                        const unavailable = isEditing
                          ? !gate.is_available &&
                            gate.gate_id !== currentGateId
                          : !gate.is_available;
                        const inactive = gate.status !== "active";
                        return (
                          <option
                            key={gate.gate_id}
                            value={gate.gate_id}
                            disabled={unavailable || inactive}
                          >
                            {`${gateLabel} — ${gate.status}${
                              unavailable ? " (occupied)" : ""
                            }`}
                          </option>
                        );
                      })}
                    </select>
                  )
                )}
                {isEditing && gateOptions.data?.current_gate_id ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    Current gate:{" "}
                    {gateOptions.data?.gates.find(
                      (gate) =>
                        gate.gate_id === gateOptions.data?.current_gate_id
                    )?.gate_code || "Unknown"}
                  </div>
                ) : null}
              </div>
              <div>
                <Label>Departure Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.departure_datetime}
                  disabled={isEditing}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((s) => {
                      const dur = scheduleById[s.flight_id]?.duration || null;
                      const autoArrival = !arrivalTouched
                        ? addDurationLocal(v, dur)
                        : s.arrival_datetime;
                      return {
                        ...s,
                        departure_datetime: v,
                        arrival_datetime: autoArrival,
                      };
                    });
                  }}
                />
              </div>
              <div>
                <Label>Arrival Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.arrival_datetime}
                  disabled={isEditing}
                  onChange={(e) => {
                    setArrivalTouched(true);
                    setForm((s) => ({
                      ...s,
                      arrival_datetime: e.target.value,
                    }));
                  }}
                />
              </div>
              <div>
                <Label>Price (USD) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_usd}
                  disabled={isEditing}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, price_usd: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => void handleSave()}
                disabled={
                  form.instance_id
                    ? updateInstance.isPending || updateGateAssignment.isPending
                    : createInstance.isPending
                }
              >
                {form.instance_id
                  ? updateInstance.isPending || updateGateAssignment.isPending
                    ? "Updating..."
                    : "Update Instance"
                  : createInstance.isPending
                  ? "Creating..."
                  : "Create Instance"}
              </Button>
              <Button variant="outline" onClick={() => handleDialogToggle(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default CreateFlightInstance;
