/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Express HTTP server when building for production.
 *
 * Learn more about Node.js server integrations here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { request as httpsRequest } from "node:https";

// The frontend node server only serves the Qwik app; auth, database and
// monitoring are owned by the C# backend (see MIGRATION_PLAN.md).
console.log("Environment configuration:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "development");
console.log("- PORT:", process.env.PORT || 3004);
console.log(
  "- VITE_API_BASE_URL:",
  process.env.VITE_API_BASE_URL || "(same origin)",
);

// Allow for dynamic port with better fallbacks
const PORT = process.env.PORT || process.env.NODE_PORT || 3004;
const API_INTERNAL_BASE_URL = (
  process.env.API_INTERNAL_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");
const backendProxyPrefixes = [
  "/f/",
  "/l/",
  "/upload",
  "/uploads",
  "/api/upload",
  "/api/uploads",
  "/api/oembed",
];

function shouldProxyToBackend(url: string | undefined): boolean {
  if (!url) return false;
  return backendProxyPrefixes.some((prefix) => url.startsWith(prefix));
}

function proxyToBackend(req: IncomingMessage, res: ServerResponse) {
  return new Promise<void>((resolve, reject) => {
    const targetUrl = new URL(req.url ?? "/", `${API_INTERNAL_BASE_URL}/`);
    const forwardedProto = req.headers["x-forwarded-proto"] ?? "https";
    const forwardedHost = req.headers["x-forwarded-host"] ?? req.headers.host;
    const proxyRequest = (targetUrl.protocol === "https:" ? httpsRequest : httpRequest)(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
          "x-forwarded-host": forwardedHost,
          "x-forwarded-proto": forwardedProto,
        },
      },
      (proxyResponse) => {
        res.writeHead(
          proxyResponse.statusCode ?? 502,
          proxyResponse.statusMessage,
          proxyResponse.headers,
        );

        proxyResponse.pipe(res);
        proxyResponse.on("end", resolve);
      },
    );

    proxyRequest.on("error", reject);

    if (req.method === "GET" || req.method === "HEAD") {
      proxyRequest.end();
      return;
    }

    req.pipe(proxyRequest);
  });
}

// Create the Qwik City express middleware
const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: {
    cacheControl: "public, max-age=31536000, immutable",
  },
  origin: process.env.BASE_URL || "https://twink.forsale",
  // Disable CSRF protection to allow ShareX uploads with null origin
  checkOrigin: false,
});

const server = createServer();

// Add better error handling and request logging for production
server.on("request", (req, res) => {
  // Handle forwarded headers from nginx proxy
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];

  if (forwardedProto && typeof forwardedProto === "string") {
    req.url = req.url?.replace(/^http:/, forwardedProto + ":");
  }
  if (forwardedHost && typeof forwardedHost === "string") {
    req.headers["host"] = forwardedHost;
  }

  // Add CORS headers for cross-origin requests
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS requests
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Log requests in production
  if (process.env.NODE_ENV === "production") {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.url} - Host: ${req.headers.host} - Proto: ${forwardedProto || "http"}`,
    );
  }

  if (shouldProxyToBackend(req.url)) {
    proxyToBackend(req, res).catch((error) => {
      console.error("Backend proxy error:", error);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.end("Bad Gateway");
      } else {
        res.destroy(error);
      }
    });
    return;
  }

  staticFile(req, res, () => {
    router(req, res, () => {
      notFound(req, res, () => {});
    });
  });
});

// Add error handling for the server
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Node server listening on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
