const fs = require("fs");
const http = require("http");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 8796;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const requestedPath = path.resolve(rootDir, decodeURIComponent(url.pathname.slice(1) || "index.html"));

  if (!requestedPath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(requestedPath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(requestedPath).toLowerCase()] || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable"
    });
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${rootDir} at http://127.0.0.1:${port}`);
});
