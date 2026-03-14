import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();

app.use(cors());

/*
Forward ALL requests to EC2 backend
*/

app.use(
  "/",
  createProxyMiddleware({
    target: "http://51.21.161.160:3000",
    changeOrigin: true,
    secure: false
  })
);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});