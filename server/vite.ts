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
  // Path should match vite.config.ts build.outDir relative to server output
  const clientDistPath = path.resolve(__dirname, "public"); 

  log(`Serving static files from: ${clientDistPath}`);

  if (!fs.existsSync(clientDistPath)) {
    log(`Error: Build directory not found at ${clientDistPath}. Make sure client build ran successfully.`);
    // Handle missing directory - maybe throw, or let the fallback handle it
  }

  // Serve static files (JS, CSS, images, etc.) from the client build directory
  app.use(express.static(clientDistPath));

  // Fallback: For any request that doesn't match a static file, serve the index.html
  // This is crucial for single-page applications (SPAs) with client-side routing
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(clientDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Handle case where index.html is missing (build might have failed)
      res.status(404).send("Client application not found. Build may be incomplete.");
    }
  });
}
