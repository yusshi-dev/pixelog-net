// @ts-check
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from 'astro/config';

// リダイレクトファイルをコピー
const copyRedirectsIntegration = () => ({
  name: "copy-redirects-integration",
  hooks: {
    "astro:config:done": () => {
      const source = path.resolve(process.cwd(), "content/_redirects");
      const dest = path.resolve(process.cwd(), "public/_redirects");

      if (fs.existsSync(source)) {
        fs.cpSync(source, dest, { force: true });
        console.log(`[copy-redirects] Copied _redirects to public/`);
      } else {
        console.warn(`[copy-redirects] _redirects not found at ${source}`);
      }
    }
  }
});

// https://astro.build/config
export default defineConfig({
    site: "https://pixelog.net",
    integrations: [copyRedirectsIntegration()]
});
