import React, { useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlightInfoCard from "@/components/FlightInfoCard";
import {
  useAirports,
  useFlightSearch,
  useBookReservation,
  type FlightSearchParams,
} from "@/hooks/useApiQuery";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}
function formatPrice(value?: number | string | null) {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "-";
  return `$${num.toFixed(2)}`;
}

export default function FlightsSearch() {
  const { toast } = useToast();
  const { account } = useAuth();
  const passengerId = account?.passenger_id ?? null;
  const { data: airports = [], isLoading: loadingAirports } = useAirports();
  const [form, setForm] = useState({
    originAirportId: "",
    destinationAirportId: "",
    departureDate: "",
  });
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(
    {}
  );

  const {
    data: flights = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useFlightSearch(searchParams);
  const bookReservation = useBookReservation();
  const [bookingInstanceId, setBookingInstanceId] = useState<number | null>(
    null
  );

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

  const handleBook = (instanceId: number, flightNo: string) => {
    if (!passengerId) {
      toast({
        title: "Booking unavailable",
        description: "This account does not have a passenger profile.",
        variant: "destructive",
      });
      return;
    }
    setBookingInstanceId(instanceId);
    bookReservation.mutate(
      { instance_id: instanceId, passenger_id: passengerId },
      {
        onSuccess: () => {
          toast({
            title: "Booked",
            description: `Reservation created for ${flightNo}`,
          });
        },
        onError: (mutationError: any) => {
          toast({
            title: "Booking failed",
            description: mutationError?.message || "Server error",
            variant: "destructive",
          });
        },
        onSettled: () => setBookingInstanceId(null),
      }
    );
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
              <Button
                type="submit"
                className="flex-1"
                disabled={loadingResults}
              >
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
            <div className="grid grid-cols-1 gap-4">
              {flights.map((flight) => (
                <FlightInfoCard
                  key={flight.instance_id}
                  flightNo={flight.flight_no}
                  airlineName={flight.airline_name}
                  airlineCode={flight.airline_code}
                  originCode={flight.origin_code}
                  originName={flight.origin_name}
                  destinationCode={flight.destination_code}
                  destinationName={flight.destination_name}
                  details={[
                    {
                      label: "Departure",
                      value: formatDateTime(flight.departure_datetime),
                    },
                    {
                      label: "Arrival",
                      value: formatDateTime(flight.arrival_datetime),
                    },
                    { label: "Price", value: formatPrice(flight.price_usd) },
                    {
                      label: "Status",
                      value: (
                        <span className="text-primary capitalize">
                          {flight.status.replace("-", " ")}
                        </span>
                      ),
                    },
                  ]}
                  footer={
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Instance #{flight.instance_id}
                      </div>
                      <Button
                        disabled={bookReservation.isPending || !passengerId}
                        onClick={() =>
                          handleBook(flight.instance_id, flight.flight_no)
                        }
                        title={
                          passengerId
                            ? "Book this flight"
                            : "Only passenger accounts can book flights"
                        }
                      >
                        {!passengerId
                          ? "Passenger only"
                          : bookReservation.isPending &&
                            bookingInstanceId === flight.instance_id
                          ? "Booking..."
                          : "Book Flight"}
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
