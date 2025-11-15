import React, {
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
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
} from "@/hooks/useApiQuery";
import { useAuth } from "@/context/AuthContext";

function toMySQLDateTime(local: string) {
  if (!local) return local;
  const [date, time] = local.split("T");
  return `${date} ${time}:00`;
}

function fromMySQLDateTime(mysqlDT?: string) {
  if (!mysqlDT) return "";
  return mysqlDT.replace(" ", "T").slice(0, 16);
}

type InstanceHandle = {
  openWith: (data: any) => void;
};

type InstanceFormState = {
  instance_id: number | null;
  flight_id: string;
  status: "on-time" | "delayed" | "cancelled";
  departure_datetime: string;
  arrival_datetime: string;
  price_usd: string;
};

const createEmptyForm = (): InstanceFormState => ({
  instance_id: null,
  flight_id: "",
  status: "on-time",
  departure_datetime: "",
  arrival_datetime: "",
  price_usd: "",
});

const CreateFlightInstance = forwardRef<InstanceHandle | null>(
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

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<InstanceFormState>(() => createEmptyForm());
    const [arrivalTouched, setArrivalTouched] = useState(false);

    const resetForm = () => {
      setForm(createEmptyForm());
      setArrivalTouched(false);
    };

    useImperativeHandle(ref, () => ({
      openWith(data: any) {
        if (!data) return;
        setForm({
          instance_id: data.instance_id ?? null,
          flight_id: String(data.flight_id ?? ""),
          status: (data.status as any) ?? "on-time",
          departure_datetime: fromMySQLDateTime(data.departure_datetime),
          arrival_datetime: fromMySQLDateTime(data.arrival_datetime),
          price_usd:
            data.price_usd === undefined || data.price_usd === null
              ? ""
              : String(data.price_usd),
        });
        setArrivalTouched(false);
        setOpen(true);
      },
    }));

    function addDurationLocal(local: string, duration?: string | null) {
      if (!local || !duration) return local;
      const parts = duration.split(":");
      const h = Number(parts[0] || 0);
      const m = Number(parts[1] || 0);
      const d = new Date(local);
      if (isNaN(d.getTime())) return local;
      d.setHours(d.getHours() + h);
      d.setMinutes(d.getMinutes() + m);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const HH = String(d.getHours()).padStart(2, "0");
      const MM = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
    }

    const handleSave = () => {
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

      if (form.instance_id) {
        updateInstance.mutate(
          {
            instance_id: form.instance_id,
            flight_id: Number(form.flight_id),
            status: form.status,
            departure_datetime: toMySQLDateTime(form.departure_datetime),
            arrival_datetime: toMySQLDateTime(form.arrival_datetime),
            price_usd: priceValue,
          },
          {
            onSuccess: () => {
              toast({
                title: "Updated",
                description: "Flight instance updated.",
              });
              setOpen(false);
              resetForm();
            },
            onError: (e: any) =>
              toast({
                title: "Update failed",
                description: e?.message || "Server error",
                variant: "destructive",
              }),
          }
        );
      } else {
        createInstance.mutate(
          {
            flight_id: Number(form.flight_id),
            status: form.status,
            departure_datetime: toMySQLDateTime(form.departure_datetime),
            arrival_datetime: toMySQLDateTime(form.arrival_datetime),
            price_usd: priceValue,
          },
          {
            onSuccess: () => {
              toast({
                title: "Created",
                description: "Flight instance created.",
              });
              setOpen(false);
              resetForm();
            },
            onError: (e: any) =>
              toast({
                title: "Create failed",
                description: e?.message || "Server error",
                variant: "destructive",
              }),
          }
        );
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
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
                  disabled={loadingSchedules}
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
                      setForm((s) => ({ ...s, status: e.target.value as any }))
                    }
                  >
                    <option value="on-time">On Time</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ) : null}
              <div>
                <Label>Departure Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.departure_datetime}
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
                  onChange={(e) =>
                    setForm((s) => ({ ...s, price_usd: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={
                  form.instance_id
                    ? updateInstance.isPending
                    : createInstance.isPending
                }
              >
                {form.instance_id
                  ? updateInstance.isPending
                    ? "Updating..."
                    : "Update Instance"
                  : createInstance.isPending
                  ? "Creating..."
                  : "Create Instance"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
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

// expose imperative handle
// (placed after component to avoid hoisting issues)

// Note: useImperativeHandle is set inside the component body below using the ref param.
