import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import pollyRoutes from "./routes/polly";
import { riddleRoutes } from "./routes/riddles";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { cloudWatchService } from "./services/cloudWatchService";
import { sesService } from "./services/sesService";

// Load environment variables

console.log("AWS_REGION:", process.env.AWS_REGION);
console.log(
  "AWS_ACCESS_KEY_ID:",
  process.env.AWS_ACCESS_KEY_ID ? "Loaded" : "Missing"
);
console.log(
  "AWS_SECRET_ACCESS_KEY:",
  process.env.AWS_SECRET_ACCESS_KEY ? "Loaded" : "Missing"
);
console.log(
  "COGNITO_USER_POOL_ID:",
  process.env.COGNITO_USER_POOL_ID ? "Loaded" : "Missing"
);
console.log(
  "COGNITO_CLIENT_ID:",
  process.env.COGNITO_CLIENT_ID ? "Loaded" : "Missing"
);
console.log(
  "COGNITO_CLIENT_SECRET:",
  process.env.COGNITO_CLIENT_SECRET ? "Loaded" : "Missing"
);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Gotham Cipher Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/polly", pollyRoutes);
app.use("/api/riddles", riddleRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🦇 Gotham Cipher Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  // Initialize CloudWatch logging and show SES status
  (async () => {
    try {
      await cloudWatchService.initialize();
    } catch (e) {
      console.warn("CloudWatch initialization failed:", e);
    }

    // Log SES config status
    if (sesService && typeof sesService.isConfigured === "function") {
      try {
        const ok = sesService.isConfigured();
        console.log(
          `SES configuration status: ${ok ? "OK" : "NOT CONFIGURED"}`
        );
      } catch (e) {
        console.warn("SES status check failed:", e);
      }
    }
  })();
});

export default app;
