console.log("[Server Start] Top of server/index.ts executing.");

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, closeDatabase } from "./db";
import cors from "cors";
import dotenv from "dotenv";

console.log("[Server Start] Imports completed.");

dotenv.config();
console.log("[Server Start] dotenv configured.");

const app = express();
console.log("[Server Start] Express app created.");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
console.log("[Server Start] Basic middleware applied.");

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
  console.log("[Server Start] Inside async setup block.");
  
  // Connect to PostgreSQL
  try {
    console.log("[Server Start] Attempting to connect to database...");
    await connectToDatabase();
    log('[Server Start] Connected to PostgreSQL successfully');
  } catch (error) {
    console.error('[Server Start] Failed to connect to database:', error);
    // Decide if you want to exit or continue if DB fails
    // process.exit(1); // Uncomment to force exit on DB connection failure
  }
  
  console.log("[Server Start] Attempting to register routes...");
  const server = await registerRoutes(app);
  console.log("[Server Start] Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Server Start] Global Error Handler caught:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // Removed throw err; as it might terminate the process prematurely in some environments
  });
  console.log("[Server Start] Global error handler registered.");

  // Setup Vite or static serving based on environment
  if (process.env.NODE_ENV === "development") {
    console.log("[Server Start] Setting up Vite HMR...");
    await setupVite(app, server);
    console.log("[Server Start] Vite HMR setup complete.");
  } else {
    console.log("[Server Start] Setting up static file serving...");
    serveStatic(app);
    console.log("[Server Start] Static file serving setup complete.");
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
  }).on('error', (err) => {
    console.error('[Server Start] Server listen error:', err); // Log errors during listen
  });
  
  // Graceful shutdown (leave as is)
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
  console.error('[Server Start] Uncaught error in async setup block:', err);
  process.exit(1);
});