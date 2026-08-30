import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { catsRouter } from "./routes/cats";

const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
    methods: ["GET"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/cats", catsRouter);

app.use((req, res) => {
  res
    .status(404)
    .json({
      error: {
        code: "not_found",
        message: `No route for ${req.method} ${req.path}`,
      },
    });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Mew & You API listening on http://localhost:${env.port}`);
});
