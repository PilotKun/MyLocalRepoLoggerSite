import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...serverOptions,
      allowedHosts: ['localhost', '127.0.0.1'] // Fix type error by specifying allowed hosts
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const clientDistPath = path.resolve(__dirname, "public"); 
  log(`[Serve Static] Configured to serve from: ${clientDistPath}`);

  if (!fs.existsSync(clientDistPath)) {
    log(`[Serve Static] Error: Build directory NOT FOUND at ${clientDistPath}.`);
  } else {
    log(`[Serve Static] Build directory found at ${clientDistPath}.`);
  }

  // Serve static files directly
  log(`[Serve Static] Setting up express.static for ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA Fallback for non-API routes
  log(`[Serve Static] Setting up SPA fallback route.`);
  app.use("*", (req, res) => {
    // Avoid interfering with API routes if they somehow fall through (shouldn't happen with vercel.json)
    if (req.originalUrl.startsWith('/api/')) {
       log(`[Serve Static] Fallback ignoring API route: ${req.originalUrl}`);
       return res.status(404).send('API route not handled.'); // Or call next() if appropriate
    }
    
    const indexPath = path.resolve(clientDistPath, "index.html");
    log(`[Serve Static] Fallback triggered for ${req.originalUrl}. Attempting to serve: ${indexPath}`);
    
    if (fs.existsSync(indexPath)) {
      log(`[Serve Static] index.html FOUND. Sending file.`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`[Serve Static] Error sending index.html: ${err}`);
          // Need to handle the error response properly here if sendFile fails
          if (!res.headersSent) {
             res.status(500).send("Error serving application.");
          }
        }
      });
    } else {
      log(`[Serve Static] Error: index.html NOT FOUND at ${indexPath}`);
      res.status(404).send("Client application index.html not found. Build may be incomplete.");
    }
  });
}
