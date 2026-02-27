import express from "express";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/static.js";

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Middleware for logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

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
        logLine += ` ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (res.statusCode > 399) console.error(logLine);
      else console.log(logLine);
    }
  });

  next();
});

// Register routes
registerRoutes(app);

// Serve static files
serveStatic(app);

export default app;
