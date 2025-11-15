import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import CreateFlightSchedule from "@/components/CreateFlightSchedule";
import CreateFlightInstance from "@/components/CreateFlightInstance";
import type { FlightInstance } from "@/hooks/useApiQuery";
import { useFlightInstances } from "@/hooks/useApiQuery";
import FlightInfoCard from "@/components/FlightInfoCard";
import { useAuth } from "@/context/AuthContext";

function formatDT(dt?: string) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString();
}

function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export default function Flight() {
  const { data: instances = [], isLoading, isError } = useFlightInstances();
  const { account, accessType } = useAuth();
  const isAirlineAdmin = accessType === "airline-admin";
  const filteredInstances = isAirlineAdmin
    ? instances.filter(
        (instance) => instance.airline_id === account?.airline_id
      )
    : instances;
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
      ) : filteredInstances.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {isAirlineAdmin
            ? "No flight instances for your airline yet."
            : "No flight instances yet. Create one to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInstances.map((instance) => (
            <FlightInfoCard
              key={instance.instance_id}
              flightNo={instance.flight_no}
              airlineName={instance.airline_name}
              airlineCode={instance.airline_code}
              originCode={instance.origin_code}
              destinationCode={instance.dest_code}
              details={[
                { label: "Departure", value: formatDT(instance.departure_datetime) },
                { label: "Arrival", value: formatDT(instance.arrival_datetime) },
                {
                  label: "Status",
                  value: (
                    <span className="text-primary capitalize">
                      {instance.status.replace("-", " ")}
                    </span>
                  ),
                },
                { label: "Price", value: formatPrice(instance.price_usd) },
              ]}
              headerAction={
                <Button
                  variant="outline"
                  size="icon"
                  title="Edit"
                  onClick={() => instanceDialogRef.current?.openWith(instance)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
