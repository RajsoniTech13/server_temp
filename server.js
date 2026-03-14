import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const EC2_API = "http://51.21.161.160:3000";
const EC2_BLOCKCHAIN = "http://51.21.161.160:4001";

/* Backend proxy */

app.use("/api", async (req, res) => {
  try {
    const url = EC2_API + req.originalUrl.replace("/api", "");
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: req.headers
    });

    res.status(response.status).json(response.data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Blockchain proxy */

app.use("/blockchain", async (req, res) => {
  try {
    const url = EC2_BLOCKCHAIN + req.originalUrl.replace("/blockchain", "");
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: req.headers
    });

    res.status(response.status).json(response.data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Render proxy running");
});

app.listen(3000, () => {
  console.log("Proxy server running");
});