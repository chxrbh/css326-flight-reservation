import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import CreateFlightSchedule from "@/components/CreateFlightSchedule";
import CreateFlightInstance from "@/components/CreateFlightInstance";
import type { FlightInstance } from "@/hooks/useApiQuery";
import { useFlightInstances } from "@/hooks/useApiQuery";

function formatDT(dt?: string) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString();
}

export default function Flight() {
  const { data: instances = [], isLoading, isError } = useFlightInstances();
  const instanceDialogRef = useRef<{
    openWith: (instance: FlightInstance) => void;
  } | null>(null);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flight Management</h1>
          <p className="text-muted-foreground">
            Manage active flight instances
          </p>
        </div>
        <div className="flex gap-2">
          <CreateFlightSchedule />
          <CreateFlightInstance ref={instanceDialogRef} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Flights</CardTitle>
        </CardHeader>
        <CardContent>{/* Room for filters later */}</CardContent>
      </Card>

      {isLoading ? (
        <div className="py-10 text-center">Loading...</div>
      ) : isError ? (
        <div className="py-10 text-center text-red-600">
          Failed to load data
        </div>
      ) : instances.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          No flight instances yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {instances.map((f) => (
            <Card key={f.instance_id} className="">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xl font-semibold">{f.flight_no}</div>
                    <div className="text-muted-foreground">
                      {f.airline_name}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Edit"
                    onClick={() => {
                      if (instanceDialogRef.current) {
                        instanceDialogRef.current.openWith(f);
                      }
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-1">
                  <div className="text-muted-foreground">Route</div>
                  <div>
                    {f.origin_code} → {f.dest_code}
                  </div>
                  <div className="text-muted-foreground">Departure</div>
                  <div>{formatDT(f.departure_datetime)}</div>
                  <div className="text-muted-foreground">Arrival</div>
                  <div>{formatDT(f.arrival_datetime)}</div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="text-primary capitalize">
                    {f.status.replace("-", " ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
