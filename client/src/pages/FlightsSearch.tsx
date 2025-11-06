import React, { useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAirports,
  useFlightSearch,
  type FlightSearchParams,
} from "@/hooks/useApiQuery";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}

export default function FlightsSearch() {
  const { data: airports = [], isLoading: loadingAirports } = useAirports();
  const [form, setForm] = useState({
    originAirportId: "",
    destinationAirportId: "",
    departureDate: "",
  });
  const [searchParams, setSearchParams] =
    useState<FlightSearchParams | null>({});

  const {
    data: flights = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useFlightSearch(searchParams);

  const loadingResults = isLoading || isFetching;
  const errorMessage =
    error instanceof Error
      ? error.message
      : "Failed to search for flights. Please try again.";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextParams: FlightSearchParams = {};

    if (form.originAirportId) {
      nextParams.originAirportId = Number(form.originAirportId);
    }

    if (form.destinationAirportId) {
      nextParams.destinationAirportId = Number(form.destinationAirportId);
    }

    if (form.departureDate) {
      nextParams.departureDate = form.departureDate;
    }

    setSearchParams(nextParams);
  };

  const onReset = () => {
    setForm({
      originAirportId: "",
      destinationAirportId: "",
      departureDate: "",
    });
    setSearchParams({});
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Flight Search</h1>
        <p className="text-muted-foreground">
          Find flight instances by selecting a route and departure date.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="grid gap-4 md:grid-cols-4 md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="origin">Origin Airport</Label>
              <select
                id="origin"
                className="w-full h-10 rounded-md border px-3"
                value={form.originAirportId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    originAirportId: event.target.value,
                  }))
                }
                disabled={loadingAirports}
              >
                <option value="">
                  {loadingAirports
                    ? "Loading airports..."
                    : "Any origin airport"}
                </option>
                {airports.map((airport) => (
                  <option
                    key={airport.airport_id}
                    value={airport.airport_id}
                  >{`${airport.airport_iata_code} — ${airport.name}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Airport</Label>
              <select
                id="destination"
                className="w-full h-10 rounded-md border px-3"
                value={form.destinationAirportId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    destinationAirportId: event.target.value,
                  }))
                }
                disabled={loadingAirports}
              >
                <option value="">
                  {loadingAirports
                    ? "Loading airports..."
                    : "Any destination airport"}
                </option>
                {airports.map((airport) => (
                  <option
                    key={airport.airport_id}
                    value={airport.airport_id}
                  >{`${airport.airport_iata_code} — ${airport.name}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departureDate">Departure Date</Label>
              <Input
                id="departureDate"
                type="date"
                value={form.departureDate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    departureDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loadingResults}>
                {loadingResults ? "Searching..." : "Search Flights"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={loadingResults}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching Flights</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingResults ? (
            <div className="py-6 text-center">Searching flights...</div>
          ) : isError ? (
            <div className="py-6 text-center text-red-600">{errorMessage}</div>
          ) : flights.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No flights available for the selected criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flight</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flights.map((flight) => (
                  <TableRow key={flight.instance_id}>
                    <TableCell className="font-medium">
                      {flight.flight_no}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{flight.airline_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {flight.airline_code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {flight.origin_code} → {flight.destination_code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {flight.origin_name ?? "-"} to{" "}
                        {flight.destination_name ?? "-"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(flight.departure_datetime)}</TableCell>
                    <TableCell>{formatDateTime(flight.arrival_datetime)}</TableCell>
                    <TableCell className="capitalize text-primary">
                      {flight.status.replace("-", " ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
