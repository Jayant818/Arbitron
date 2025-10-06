import express from "express";
import "dotenv/config";
import cors from "cors";
import { ContestRouter } from "./routes/contest";

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT must be defined in environment variables");
}

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/api/v1/contest", ContestRouter);

app.get("/", (req, res) => res.send({ message: "API is running" }));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
