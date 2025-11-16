import "dotenv/config";
import express from "express";
import cors from "cors";
//import usersRouter from "./routes/users";
import airlinesRouter from "./routes/airlines";
import flightsRouter from "./routes/flights";
import airportsRouter from "./routes/airports";
import reservationsRouter from "./routes/reservations";
import authRouter from "./routes/auth";
import testRouter from "./routes/test_alter-view";
import airlineAdminsRouter from "./routes/airlineAdmins";


const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

//app.use("/api/users", usersRouter);
app.use("/api/airlines", airlinesRouter);
app.use("/api/airline-admins", airlineAdminsRouter);
app.use("/api/airports", airportsRouter);
app.use("/api", flightsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/auth", authRouter);
app.use("/api", testRouter);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
