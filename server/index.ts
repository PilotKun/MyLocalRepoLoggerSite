console.log("[Server Start] Top of server/index.ts executing.");

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, closeDatabase } from "./db";
import cors from "cors";
import dotenv from "dotenv";

console.log("[Server Start] Imports completed.");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[Server Start] Inside async block.");
  // Connect to PostgreSQL
  try {
    await connectToDatabase();
    log('Connected to PostgreSQL successfully');
  } catch (error) {
    log('Failed to connect to database: ' + error);
    // Continue execution even if PostgreSQL fails - the app can fallback to in-memory storage
  }
  
  const server = await registerRoutes(app);
  console.log("[Server Start] Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  const port = Number(process.env.PORT || 5001);
  console.log(`[Server Start] Attempting to listen on port: ${port}`);
  server.listen(port, () => {
    try {
      log(`Server is running on http://localhost:${port}`);
    } catch {
      console.log(`[Server Start] Server successfully listening on port: ${port}`);
    }
  });
  
  // Add graceful shutdown for PostgreSQL connection
  process.on('SIGINT', async () => {
    log('Shutting down server...');
    try {
      await closeDatabase();
      log('Database connection closed');
    } catch (error) {
      log('Error closing database: ' + error);
    }
    process.exit(0);
  });
})().catch(err => {
  // Log any errors during async setup
  console.error('[Server Start] Failed to start server:', err);
  process.exit(1);
});