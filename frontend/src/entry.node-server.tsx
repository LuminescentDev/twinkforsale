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
import { createServer } from "node:http";

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
