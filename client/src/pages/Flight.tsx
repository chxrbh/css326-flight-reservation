import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import CreateFlightSchedule from "@/components/CreateFlightSchedule";
import CreateFlightInstance from "@/components/CreateFlightInstance";
import type { FlightInstance } from "@/hooks/useApiQuery";
import { useFlightInstances, useFlightSchedules } from "@/hooks/useApiQuery";
import FlightInfoCard from "@/components/FlightInfoCard";
import { useAuth } from "@/context/AuthContext";
import { formatLocalDateTime } from "@/lib/datetime";

type StatusFilterValue = "all" | FlightInstance["status"];
type ScheduleFilterValue = "all" | number;
type InstanceFilterParams = Parameters<typeof useFlightInstances>[0];

function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export default function Flight() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [scheduleFilter, setScheduleFilter] =
    useState<ScheduleFilterValue>("all");
  const instanceFilters = useMemo<InstanceFilterParams | undefined>(() => {
    const filters: InstanceFilterParams = {};
    if (statusFilter !== "all") {
      filters.status = [statusFilter];
    }
    if (scheduleFilter !== "all") {
      filters.flight_id = scheduleFilter;
    }
    return Object.keys(filters).length ? filters : undefined;
  }, [statusFilter, scheduleFilter]);
  const { data: schedules = [] } = useFlightSchedules();
  const { account, accessType } = useAuth();
  const isAirlineAdmin = accessType === "airline-admin";
  const adminAirlineId = account?.airline_id;
  const scheduleOptions = useMemo(() => {
    if (isAirlineAdmin && adminAirlineId) {
      return schedules.filter((schedule) => schedule.airline_id === adminAirlineId);
    }
    return schedules;
  }, [schedules, isAirlineAdmin, adminAirlineId]);
  useEffect(() => {
    if (
      scheduleFilter !== "all" &&
      !scheduleOptions.some((schedule) => schedule.flight_id === scheduleFilter)
    ) {
      setScheduleFilter("all");
    }
  }, [scheduleFilter, scheduleOptions]);
  const { data: instances = [], isLoading, isError } =
    useFlightInstances(instanceFilters);
  const filteredInstances = useMemo(() => {
    if (!isAirlineAdmin) return instances;
    return instances.filter(
      (instance) => instance.airline_id === adminAirlineId
    );
  }, [isAirlineAdmin, instances, adminAirlineId]);
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
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex flex-col text-sm font-medium text-muted-foreground">
              Status
              <select
                className="mt-1 border border-input bg-background rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilterValue)
                }
              >
                <option value="all">All statuses</option>
                <option value="on-time">On time</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-muted-foreground">
              Flight schedule
              <select
                className="mt-1 border border-input bg-background rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={scheduleFilter === "all" ? "all" : String(scheduleFilter)}
                onChange={(event) => {
                  const { value } = event.target;
                  setScheduleFilter(value === "all" ? "all" : Number(value));
                }}
              >
                <option value="all">All schedules</option>
                {scheduleOptions.map((schedule) => (
                  <option key={schedule.flight_id} value={schedule.flight_id}>
                    {schedule.flight_no} ({schedule.origin_code} &rarr; {schedule.dest_code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
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
                {
                  label: "Departure",
                  value: formatLocalDateTime(instance.departure_datetime),
                },
                {
                  label: "Arrival",
                  value: formatLocalDateTime(instance.arrival_datetime),
                },
                {
                  label: "Status",
                  value: (
                    <span className="text-primary capitalize">
                      {instance.status.replace("-", " ")}
                    </span>
                  ),
                },
                {
                  label: "Gate",
                  value: instance.gate_code ? (
                    `Gate ${instance.gate_code}`
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
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
