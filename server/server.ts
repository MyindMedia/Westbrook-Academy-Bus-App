import express from "express";
import powerschoolRoutes from "./routes/powerschool";
import dotenv from "dotenv";
import cors from "cors";

// Initialize environment
dotenv.config();

const app = express();
const PORT = 3001; // Running on 3001 to avoid conflict with Vite on 3000

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Prefix with /api/powerschool to match frontend expectation
app.use("/api/powerschool", powerschoolRoutes);

app.get("/health", (req, res) => {
  res.send("Westbrook Backend Online");
});

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
