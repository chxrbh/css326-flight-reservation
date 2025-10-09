import "dotenv/config";
import express from "express";
import cors from "cors";
//import usersRouter from "./routes/users";
import airlinesRouter from "./routes/airlines";

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

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
