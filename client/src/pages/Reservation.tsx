import { useMemo, useState } from "react";
import FlightInfoCard from "@/components/FlightInfoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useReservations,
  useFlightSchedules,
  useUpdateReservationStatus,
} from "@/hooks/useApiQuery";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function Reservation() {
  const { toast } = useToast();
  const { account, accessType } = useAuth();
  const isAirlineAdmin = accessType === "airline-admin";
  const isPassenger = accessType === "passenger";
  const airlineId = isAirlineAdmin ? account?.airline_id : undefined;
  const passengerId = isPassenger ? account?.passenger_id : undefined;
  const airlineLabel = account?.name
    ? account.name.split(" ")[0]
    : "their";

  const [flightFilter, setFlightFilter] = useState<string>("");
  const { data: flightSchedules = [] } = useFlightSchedules();
  const availableFlights = useMemo(() => {
    if (!isAirlineAdmin || !airlineId) return [];
    return flightSchedules.filter((flight) => flight.airline_id === airlineId);
  }, [isAirlineAdmin, flightSchedules, airlineId]);

  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
  } = useReservations({
    airlineId,
    flightId: flightFilter ? Number(flightFilter) : undefined,
    passengerId,
  });

  const updateStatus = useUpdateReservationStatus();
  const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(null);
  const [seatDrafts, setSeatDrafts] = useState<Record<number, string>>({});

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Unable to load reservations right now.";

  const handleCheckIn = (ticketId: number, seatValue?: string) => {
    setUpdatingTicketId(ticketId);
    updateStatus.mutate(
      {
        ticket_id: ticketId,
        status: "checked-In",
        seat: seatValue?.trim() ? seatValue.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Ticket updated",
            description: "Passenger marked as checked-in.",
          });
        },
        onError: (mutationError: any) => {
          toast({
            title: "Update failed",
            description: mutationError?.message || "Server error",
            variant: "destructive",
          });
        },
        onSettled: () => setUpdatingTicketId(null),
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="text-muted-foreground">
          {isAirlineAdmin
            ? "Monitor passengers on your flights and mark check-ins."
            : "Review your booked tickets."}
        </p>
        {isPassenger && !passengerId && (
          <p className="text-sm text-red-600 mt-2">
            This account is missing a passenger profile. Please contact support.
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booked Tickets</CardTitle>
          {isAirlineAdmin && (
            <p className="text-sm text-muted-foreground">
              Showing only flights under {airlineLabel}'s airline.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isAirlineAdmin && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="flight-filter">Filter by Flight</Label>
                <select
                  id="flight-filter"
                  className="w-full h-10 rounded-md border px-3 bg-white"
                  value={flightFilter}
                  onChange={(event) => setFlightFilter(event.target.value)}
                >
                  <option value="">All flights</option>
                  {availableFlights.map((flight) => (
                    <option key={flight.flight_id} value={flight.flight_id}>
                      {flight.flight_no}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-6 text-center">Loading reservations...</div>
          ) : isError ? (
            <div className="py-6 text-center text-red-600">{errorMessage}</div>
          ) : reservations.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No reservations yet.{" "}
              {isAirlineAdmin
                ? "Try another flight filter."
                : "Book a flight from the search page."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reservations.map((reservation) => {
                const seatValue =
                  seatDrafts[reservation.ticket_id] ??
                  reservation.seat ??
                  "";
                const canCheckIn =
                  isAirlineAdmin && reservation.status !== "checked-In";
                const isUpdating =
                  updateStatus.isPending &&
                  updatingTicketId === reservation.ticket_id;

                return (
                  <FlightInfoCard
                    key={reservation.ticket_id}
                    flightNo={reservation.flight_no}
                    airlineName={reservation.airline_name}
                    airlineCode={reservation.airline_code}
                    originCode={reservation.origin_code}
                    originName={reservation.origin_name}
                    destinationCode={reservation.destination_code}
                    destinationName={reservation.destination_name}
                    details={[
                      { label: "Booking Date", value: formatDate(reservation.booking_date) },
                      { label: "Departure", value: formatDateTime(reservation.departure_datetime) },
                      { label: "Arrival", value: formatDateTime(reservation.arrival_datetime) },
                      {
                        label: "Status",
                        value: (
                          <span className="text-primary capitalize">
                            {reservation.status.replace("-", " ")}
                          </span>
                        ),
                      },
                      {
                        label: "Seat",
                        value: reservation.seat ? reservation.seat : "TBD",
                      },
                    ]}
                    footer={
                      <div className="text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-muted-foreground">
                          Ticket {reservation.ticket_no} • Passenger{" "}
                          {reservation.first_name} {reservation.last_name}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            Instance #{reservation.instance_id}
                          </span>
                          {canCheckIn && (
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col text-xs">
                                <Label htmlFor={`seat-${reservation.ticket_id}`}>
                                  Seat
                                </Label>
                                <Input
                                  id={`seat-${reservation.ticket_id}`}
                                  className="h-8 w-24 text-sm"
                                  placeholder="e.g. 12A"
                                  value={seatValue}
                                  onChange={(event) =>
                                    setSeatDrafts((prev) => ({
                                      ...prev,
                                      [reservation.ticket_id]:
                                        event.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCheckIn(
                                    reservation.ticket_id,
                                    seatValue
                                  )
                                }
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Updating..." : "Check-in"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
