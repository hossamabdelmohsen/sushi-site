const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const imagesDir = path.join(rootDir, "images");
const outputDir = path.join(imagesDir, "optimized");
const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const defaultImageWidths = [320, 640, 960, 1200];
const imageProfiles = {
  "hero-bg": {
    widths: [768, 1280, 1920],
    quality: 0.72
  },
  "Logo": {
    widths: [160, 320, 640],
    quality: 0.82
  }
};
const defaultWebpQuality = 0.78;

function walkImages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "optimized" ? [] : walkImages(entryPath);
    }

    if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      return [];
    }

    return [path.relative(rootDir, entryPath).replace(/\\/g, "/")];
  });
}

function getImageBaseName(sourcePath) {
  const parsedPath = path.parse(sourcePath);
  return parsedPath.name;
}

function getImageProfile(sourcePath) {
  const baseName = getImageBaseName(sourcePath);
  return imageProfiles[baseName] || {
    widths: defaultImageWidths,
    quality: defaultWebpQuality
  };
}

function getOutputPath(sourcePath, width) {
  const baseName = getImageBaseName(sourcePath);
  return path.join(outputDir, `${baseName}-${width}.webp`);
}

function getDefaultOutputPath(sourcePath) {
  const baseName = getImageBaseName(sourcePath);
  return path.join(outputDir, `${baseName}.webp`);
}

function getChromePath() {
  return chromePaths.find((candidate) => fs.existsSync(candidate));
}

function sendJson(response, value) {
  response.writeHead(200, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(value));
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "cache-control": "no-store" });
    response.end(data);
  });
}

function buildPage() {
  return `<!doctype html>
<meta charset="utf-8">
<title>Sushi Box Image Optimizer</title>
<script>
const imageProfiles = ${JSON.stringify(imageProfiles)};
const defaultImageWidths = ${JSON.stringify(defaultImageWidths)};
const defaultWebpQuality = ${defaultWebpQuality};

function getImageBaseName(sourcePath) {
  const fileName = sourcePath.split("/").pop() || "";
  const extensionIndex = fileName.lastIndexOf(".");
  return extensionIndex === -1 ? fileName : fileName.slice(0, extensionIndex);
}

function getImageProfile(sourcePath) {
  return imageProfiles[getImageBaseName(sourcePath)] || {
    widths: defaultImageWidths,
    quality: defaultWebpQuality
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = encodeURI("/" + src);
  });
}

async function canvasToWebpBase64(canvas, quality) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) {
    throw new Error("The browser could not encode a WebP image.");
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return btoa(binary);
}

async function encodeImageVariant(image, sourcePath, width, quality) {
  const scale = Math.min(1, width / Math.max(image.naturalWidth, image.naturalHeight));
  const outputWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const outputHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d", { alpha: true });
  context.drawImage(image, 0, 0, outputWidth, outputHeight);
  const base64 = await canvasToWebpBase64(canvas, quality);
  await fetch("/write", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sourcePath,
      width,
      base64,
      outputWidth,
      outputHeight
    })
  });
}

async function encodeImage(sourcePath) {
  const image = await loadImage(sourcePath);
  const profile = getImageProfile(sourcePath);

  for (const width of profile.widths) {
    await encodeImageVariant(image, sourcePath, width, profile.quality);
  }
}

async function run() {
  const response = await fetch("/images.json");
  const images = await response.json();
  for (const imagePath of images) {
    await encodeImage(imagePath);
  }
  await fetch("/done", { method: "POST" });
}

run().catch(async (error) => {
  await fetch("/error", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: error && error.message ? error.message : String(error) })
  });
});
</script>`;
}

async function main() {
  const chromePath = getChromePath();
  if (!chromePath) {
    throw new Error("Chrome or Edge was not found.");
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const images = walkImages(imagesDir);
  const results = [];

  let finish;
  let fail;
  const completed = new Promise((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html", "cache-control": "no-store" });
      response.end(buildPage());
      return;
    }

    if (request.method === "GET" && url.pathname === "/images.json") {
      sendJson(response, images);
      return;
    }

    if (request.method === "GET") {
      let decodedPath = "";
      try {
        decodedPath = decodeURIComponent(url.pathname.slice(1));
      } catch (error) {
        response.writeHead(400);
        response.end("Bad request");
        return;
      }

      const requestedPath = path.resolve(rootDir, decodedPath);
      if (!requestedPath.startsWith(rootDir)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      sendFile(response, requestedPath);
      return;
    }

    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (request.method === "POST" && url.pathname === "/write") {
        const payload = JSON.parse(body);
        const sourcePath = String(payload.sourcePath || "");
        const width = Number(payload.width) || 0;
        const outputPath = getOutputPath(sourcePath, width);
        const data = Buffer.from(String(payload.base64 || ""), "base64");
        fs.writeFileSync(outputPath, data);

        const profile = getImageProfile(sourcePath);
        if (width === Math.max(...profile.widths)) {
          fs.writeFileSync(getDefaultOutputPath(sourcePath), data);
        }

        results.push({
          sourcePath,
          outputPath: path.relative(rootDir, outputPath).replace(/\\/g, "/"),
          bytes: data.length,
          width: Number(payload.outputWidth) || width,
          height: Number(payload.outputHeight) || 0
        });
        sendJson(response, { ok: true });
        return;
      }

      if (request.method === "POST" && url.pathname === "/done") {
        sendJson(response, { ok: true });
        finish();
        return;
      }

      if (request.method === "POST" && url.pathname === "/error") {
        sendJson(response, { ok: true });
        fail(new Error(JSON.parse(body).message || "Image optimization failed."));
        return;
      }

      response.writeHead(404);
      response.end("Not found");
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    `--user-data-dir=${path.join(rootDir, ".cache", "image-optimizer-chrome")}`,
    `http://127.0.0.1:${port}/`
  ], { stdio: "ignore" });

  try {
    await completed;
  } finally {
    chrome.kill();
    server.close();
  }

  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  console.log(JSON.stringify({
    images: results.length,
    bytes: totalBytes,
    outputDir: path.relative(rootDir, outputDir).replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
