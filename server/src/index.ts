import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRouter from "./routes/auth";
import airlinesRouter from "./routes/airlines";
import flightSchedulesRouter from "./routes/flight_schedules";
import flightInstancesRouter from "./routes/flight_instances";
import searchFlightsRouter from "./routes/search_flights";
import ticketsRouter from "./routes/tickets";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- Routes based on website pages ----
app.use("/auth", authRouter);                     // /auth page (signin/signup in one page)
app.use("/super-admin", airlinesRouter);          // /super-admin page (manage airlines)
app.use("/flights", flightInstancesRouter);       // /flights page (flight management/filter)
app.use("/create-schedule", flightSchedulesRouter); // /create-schedule page
app.use("/create-instance", flightInstancesRouter); // /create-instance page
app.use("/search-flight", searchFlightsRouter);   // /search-flight page (passenger flight search)
app.use("/reservations", ticketsRouter);          // /reservations page (user’s booked tickets)

// ---- Server start ----
app.listen(4000, () => {
  console.log("API running at http://localhost:4000");
});
