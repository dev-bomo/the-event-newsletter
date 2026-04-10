import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5173;
const base = "/";

const app = express();

let vite;
let template;
let render;

if (!isProd) {
  const { createServer } = await import("vite");
  vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  app.use(base, express.static(path.resolve(__dirname, "dist/client"), { index: false }));
  template = await fs.readFile(path.resolve(__dirname, "dist/client/index.html"), "utf-8");
  ({ render } = await import("./dist/server/entry-server.js"));
}

app.use(async (req, res) => {
  try {
    const url = req.originalUrl;

    let htmlTemplate;
    let renderFn;

    if (!isProd) {
      htmlTemplate = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
      htmlTemplate = await vite.transformIndexHtml(url, htmlTemplate);
      ({ render: renderFn } = await vite.ssrLoadModule("/src/entry-server.tsx"));
    } else {
      htmlTemplate = template;
      renderFn = render;
    }

    const { appHtml, head } = await renderFn(url);
    const html = htmlTemplate
      .replace("<!--ssr-head-->", head ?? "")
      .replace("<!--ssr-outlet-->", appHtml ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (err) {
    vite?.ssrFixStacktrace(err);
    res.status(500).end((err instanceof Error ? err.stack : String(err)) || "Internal Server Error");
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SSR server running on http://localhost:${port}`);
});
