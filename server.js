import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import http from "http";

const app = express();

app.use(cors());

// 1. Create a custom HTTP agent to keep connections alive 
// and handle high volumes of concurrent requests
const keepAliveAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,      // Maximum number of sockets to allow per host
  maxFreeSockets: 10,   // Maximum number of sockets to leave open in a free state
  timeout: 120000,      // 2 minutes before the socket times out
});

/*
Forward ALL requests to EC2 backend
*/
app.use(
  "/",
  createProxyMiddleware({
    target: "https://breach-backend-ucq3.onrender.com",
    changeOrigin: true,
    secure: false,
    agent: keepAliveAgent, // Use the custom agent we created above
    proxyTimeout: 120000,  // Time (in ms) to wait for the backend EC2 to send a response
    timeout: 120000,       // Time (in ms) for the incoming request
    ws: true,              // Enable WebSocket proxying (helpful if you use Socket.io)
    
    // 2. Add error handling so it doesn't just die silently
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${err.code}: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({
          error: "Bad Gateway",
          message: "The proxy server could not get a response from the EC2 backend."
        });
      }
    },
    
    // Optional: Log requests to debug what is happening
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[>> Proxying] ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[<< Response] ${proxyRes.statusCode} from ${req.url}`);
    }
  })
);

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// 3. Prevent Express itself from dropping connections before the proxy does
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 125000;   // Should be slightly higher than keepAliveTimeout