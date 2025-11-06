import React, { useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateFlightSchedule,
  useAirports,
  useAirlines,
} from "@/hooks/useApiQuery";
import { useAuth } from "@/context/AuthContext";

export default function CreateFlightSchedule() {
  const { toast } = useToast();
  const { data: airports = [], isLoading: loadingAirports } = useAirports();
  const { data: airlines = [], isLoading: loadingAirlines } = useAirlines();
  const createSchedule = useCreateFlightSchedule();
  const { accessType, account } = useAuth();
  const isSuperAdmin = accessType === "super-admin";
  const adminAirlineId = !isSuperAdmin ? account?.airline_id : undefined;
  const adminAirline = useMemo(
    () => airlines.find((a: any) => a.id === adminAirlineId),
    [airlines, adminAirlineId]
  );

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    flight_no: "",
    aircraft_type: "",
    origin_airport_id: "",
    destination_airport_id: "",
    durationHours: "",
    durationMinutes: "",
    airline_id: isSuperAdmin ? "" : adminAirlineId?.toString() ?? "",
  });

  const toHHMMSS = (hh: string, mm: string) =>
    hh && mm ? `${hh}:${mm}:00` : `00`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="h-4 w-4" /> Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Flight Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Flight Number *</Label>
              <Input
                value={f.flight_no}
                onChange={(e) =>
                  setF((s) => ({ ...s, flight_no: e.target.value }))
                }
                placeholder="e.g., SA101"
              />
            </div>
            <div>
              <Label>Aircraft Type</Label>
              <Input
                value={f.aircraft_type}
                onChange={(e) =>
                  setF((s) => ({ ...s, aircraft_type: e.target.value }))
                }
                placeholder="e.g., Boeing 737"
              />
            </div>
            <div>
              <Label>Origin Airport *</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border px-3"
                value={f.origin_airport_id}
                disabled={loadingAirports}
                onChange={(e) =>
                  setF((s) => ({ ...s, origin_airport_id: e.target.value }))
                }
              >
                <option value="">
                  {loadingAirports ? "Loading airports..." : "Select origin..."}
                </option>
                {airports.map((a) => (
                  <option key={a.airport_id} value={a.airport_id}>
                    {a.airport_iata_code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Destination Airport *</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border px-3"
                value={f.destination_airport_id}
                disabled={loadingAirports}
                onChange={(e) =>
                  setF((s) => ({
                    ...s,
                    destination_airport_id: e.target.value,
                  }))
                }
              >
                <option value="">
                  {loadingAirports
                    ? "Loading airports..."
                    : "Select destination..."}
                </option>
                {airports.map((a) => (
                  <option key={a.airport_id} value={a.airport_id}>
                    {a.airport_iata_code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Duration (HH:MM)</Label>
              <div style={{ display: "flex", gap: "8px" }}>
                <Input
                  type="number"
                  min="0"
                  placeholder="HH"
                  value={f.durationHours || ""}
                  onChange={(e) =>
                    setF((s) => ({ ...s, durationHours: e.target.value }))
                  }
                />
                :
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="MM"
                  value={f.durationMinutes || ""}
                  onChange={(e) =>
                    setF((s) => ({ ...s, durationMinutes: e.target.value }))
                  }
                />
              </div>
            </div>
            {isSuperAdmin ? (
              <div>
                <Label>Airline *</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border px-3"
                  value={f.airline_id}
                  disabled={loadingAirlines}
                  onChange={(e) =>
                    setF((s) => ({ ...s, airline_id: e.target.value }))
                  }
                >
                  <option value="">
                    {loadingAirlines
                      ? "Loading airlines..."
                      : "Select airline..."}
                  </option>
                  {airlines?.map((al: { id: number; name: string }) => (
                    <option key={al.id} value={al.id}>
                      {al.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label>Airline</Label>
                <div className="mt-1 h-10 flex items-center rounded-md border px-3 bg-muted">
                  {adminAirline?.name
                    ? `${adminAirline.name}${
                        adminAirline.code ? ` (${adminAirline.code})` : ""
                      }`
                    : `Airline #${adminAirlineId ?? "-"}`}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (
                  !f.flight_no ||
                  !f.origin_airport_id ||
                  !f.destination_airport_id ||
                  (!isSuperAdmin && !adminAirlineId) ||
                  (isSuperAdmin && !f.airline_id)
                )
                  return;
                const airlineIdToUse = isSuperAdmin
                  ? Number(f.airline_id)
                  : Number(adminAirlineId);
                createSchedule.mutate(
                  {
                    flight_no: f.flight_no,
                    origin_airport_id: Number(f.origin_airport_id),
                    destination_airport_id: Number(f.destination_airport_id),
                    aircraft_type: f.aircraft_type || undefined,
                    duration: f.durationHours
                      ? toHHMMSS(f.durationHours, f.durationMinutes)
                      : undefined,
                    airline_id: airlineIdToUse,
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Created",
                        description: "Flight schedule created.",
                      });
                      setOpen(false);
                      setF({
                        flight_no: "",
                        aircraft_type: "",
                        origin_airport_id: "",
                        destination_airport_id: "",
                        durationHours: "",
                        durationMinutes: "",
                        airline_id: isSuperAdmin
                          ? ""
                          : adminAirlineId?.toString() ?? "",
                      });
                    },
                    onError: (e: any) =>
                      toast({
                        title: "Create failed",
                        description: e?.message || "Server error",
                        variant: "destructive",
                      }),
                  }
                );
              }}
              disabled={createSchedule.isPending}
            >
              {createSchedule.isPending ? "Creating..." : "Create Schedule"}
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
