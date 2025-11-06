import FlightInfoCard from "@/components/FlightInfoCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReservations } from "@/hooks/useApiQuery";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function Reservation() {
  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
  } = useReservations();

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Unable to load reservations right now.";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="text-muted-foreground">
          Review recently booked tickets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booked Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center">Loading reservations...</div>
          ) : isError ? (
            <div className="py-6 text-center text-red-600">{errorMessage}</div>
          ) : reservations.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No reservations yet. Book a flight from the search page.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reservations.map((reservation) => (
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
                    <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span>
                        Ticket {reservation.ticket_no} • Passenger{" "}
                        {reservation.first_name} {reservation.last_name}
                      </span>
                      <span>Instance #{reservation.instance_id}</span>
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
