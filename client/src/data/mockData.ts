export const mockFlights = [
  {
    id: "AA101",
    flightNumber: "AA 101",
    airline: "American Airlines",
    departure: {
      airport: "JFK",
      city: "New York",
      time: "08:30",
    },
    arrival: {
      airport: "LAX",
      city: "Los Angeles",
      time: "11:45",
    },
    duration: "5h 15m",
    price: 299,
    status: "scheduled" as const,
  },
  {
    id: "DL205",
    flightNumber: "DL 205",
    airline: "Delta Airlines",
    departure: {
      airport: "ATL",
      city: "Atlanta",
      time: "14:20",
    },
    arrival: {
      airport: "ORD",
      city: "Chicago",
      time: "15:55",
    },
    duration: "2h 35m",
    price: 189,
    status: "boarding" as const,
  },
  {
    id: "UA567",
    flightNumber: "UA 567",
    airline: "United Airlines",
    departure: {
      airport: "SFO",
      city: "San Francisco",
      time: "19:10",
    },
    arrival: {
      airport: "SEA",
      city: "Seattle",
      time: "21:25",
    },
    duration: "2h 15m",
    price: 156,
    status: "delayed" as const,
  },
  {
    id: "SW892",
    flightNumber: "SW 892",
    airline: "Southwest Airlines",
    departure: {
      airport: "DEN",
      city: "Denver",
      time: "12:00",
    },
    arrival: {
      airport: "PHX",
      city: "Phoenix",
      time: "13:30",
    },
    duration: "1h 30m",
    price: 129,
    status: "departed" as const,
  },
];

export const mockAirlines = [
  {
    id: "AA",
    name: "American Airlines",
    code: "AA",
    country: "United States",
  },
  {
    id: "DL",
    name: "Delta Airlines",
    code: "DL",
    country: "United States",
  },
  {
    id: "UA",
    name: "United Airlines",
    code: "UA",
    country: "United States",
  },
  {
    id: "SW",
    name: "Southwest Airlines",
    code: "SW",
    country: "United States",
  },
];

export const mockReservations = [
  {
    id: "RES001",
    flightId: "AA101",
    passengerName: "John Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0123",
    seatNumber: "12A",
    bookingDate: "2024-01-15",
    status: "confirmed" as const,
    totalPrice: 299,
  },
  {
    id: "RES002",
    flightId: "DL205",
    passengerName: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1-555-0456",
    seatNumber: "8C",
    bookingDate: "2024-01-14",
    status: "pending" as const,
    totalPrice: 189,
  },
  {
    id: "RES003",
    flightId: "UA567",
    passengerName: "Michael Brown",
    email: "m.brown@email.com",
    phone: "+1-555-0789",
    seatNumber: "15F",
    bookingDate: "2024-01-13",
    status: "cancelled" as const,
    totalPrice: 156,
  },
];
