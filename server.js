const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const API_BASE = "https://free-api-anuragsingh.vercel.app/api/number?num=";

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS headers — allow all origins for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve frontend
  if (parsed.pathname === "/" || parsed.pathname === "/index.html") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("index.html not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }

  // Proxy endpoint: /lookup?phone=XXXXXXXXXX
  if (parsed.pathname === "/lookup") {
    const phone = parsed.query.phone;
    if (!phone) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Phone number required" }));
      return;
    }

    const apiUrl = API_BASE + encodeURIComponent(phone);
    console.log(`[${new Date().toLocaleTimeString()}] Fetching: ${apiUrl}`);

    https.get(apiUrl, (apiRes) => {
      let body = "";
      apiRes.on("data", chunk => body += chunk);
      apiRes.on("end", () => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(body);
      });
    }).on("error", (err) => {
      console.error("API fetch error:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Failed to reach upstream API" }));
    });

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/lookup?phone=XXXXXXXXXX\n`);
});
