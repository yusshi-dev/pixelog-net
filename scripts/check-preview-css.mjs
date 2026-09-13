#!/usr/bin/env node
/**
 * preview.css が CMS のプレビューと同じ見た目になっているかを検証する。
 *
 * CMS のプレビューには Tailwind の preflight が無いため、記事ページで
 * 「サイトのスタイルを無効化した状態（＝ブラウザ既定 + preview.css だけ）」を作り、
 * 記事本文（.prose）の計算値とサイトの記事の計算値を突き合わせる。
 *
 * 使い方:
 *   npm run build
 *   npm run preview              # 別ターミナルで起動しておく
 *   npm run check:preview
 *
 * オプション:
 *   --url <url>      接続先（既定 http://localhost:4321）
 *   --page <path>    検証に使うページ（既定 /about/）
 *   --browser <path> 使用するブラウザの実行ファイル（既定は自動検出）
 *
 * 終了コード: 差分があれば 1。
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULTS = {
  url: "http://localhost:4321",
  page: "/about/",
};

const PROPS = [
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "font-family",
  "color",
  "background-color",
  "border-left-width",
  "border-left-color",
  "border-bottom-width",
  "border-bottom-color",
  "border-top-width",
  "border-radius",
  "display",
  "list-style-type",
  "text-decoration-line",
  "text-underline-offset",
  "gap",
  "cursor",
];

// 記事で使う要素を一通り（preview.css 側のルールが網羅されているか確認する）
const CONTENT = [
  "<h2>見出し2</h2>",
  "<p>段落です。<a href='#'>リンク</a>と<code>インラインコード</code>を含みます。</p>",
  "<h3>見出し3</h3>",
  "<h4>見出し4</h4>",
  "<h5>見出し5</h5>",
  "<h6>見出し6</h6>",
  "<ul><li>項目1</li><li>項目2<ul><li>ネスト</li></ul></li><li>項目3</li></ul>",
  "<ol><li>手順1</li><li>手順2<ol><li>ネスト1</li></ol></li><li>手順3</li></ol>",
  "<blockquote><p>引用の段落</p><p>2つ目の段落</p></blockquote>",
  "<pre><code>const a = 1;</code></pre>",
  "<table><thead><tr><th>見出し</th><th>値</th></tr></thead><tbody><tr><td>セル</td><td>1</td></tr></tbody></table>",
  "<hr>",
  "<figure><img src='/favicon.svg' alt=''><figcaption>キャプション</figcaption></figure>",
  "<details><summary>閉じた状態</summary><p>中身の段落</p><pre><code>code</code></pre></details>",
  "<details open><summary>開いた状態</summary><p>中身の段落</p><pre><code>code</code></pre></details>",
  "<div class='alert'>注記のテキスト</div>",
  "<div class='alert caution'><p>注意の注記</p><ul><li>項目</li></ul></div>",
  "<div class='alert warning'>警告の注記</div>",
].join("\n");

const SETUP = `(() => {
  const prose = document.querySelector('.prose');
  if (!prose) return 'no-prose';
  const holder = document.createElement('div');
  holder.id = 'preview-check-content';
  holder.innerHTML = ${JSON.stringify(CONTENT)};
  prose.appendChild(holder);
  return 'ok';
})()`;

const DUMP = `(() => {
  const props = ${JSON.stringify(PROPS)};
  const els = [document.querySelector('.prose'), ...document.querySelectorAll('.prose *')];
  return els.map((el, i) => {
    const cs = getComputedStyle(el);
    const clean = (v) => (v && v.length > 70 ? v.slice(0, 70) : v);
    return [i, el.tagName, (el.getAttribute('class') || '').slice(0, 26)].join('|') + '|' +
      props.map((p) => p + '=' + clean(cs.getPropertyValue(p))).join('|');
  }).join('\\n');
})()`;

const INJECT = `(async () => {
  const link = document.createElement('link');
  link.id = 'preview-css-check';
  link.rel = 'stylesheet';
  link.href = '/admin/preview.css';
  document.head.appendChild(link);
  await new Promise((r) => { link.onload = r; link.onerror = r; });
  await new Promise((r) => setTimeout(r, 400));
  return JSON.stringify({
    sheetLoaded: !!link.sheet,
    notoSansLoaded: document.fonts.check('16px "Noto Sans JP"'),
    pageIsDark: document.documentElement.classList.contains('dark'),
  });
})()`;

// サイト側のスタイルシートと <style> を無効化し、preview.css だけを残す
const DISABLE_SITE = `(() => {
  let n = 0;
  for (const link of document.querySelectorAll('link[rel=stylesheet]')) {
    if (!(link.href || '').includes('/admin/preview.css')) { link.disabled = true; n++; }
  }
  for (const s of document.querySelectorAll('style')) { s.disabled = true; n++; }
  return n;
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === "--url") opts.url = argv[++i];
    else if (key === "--page") opts.page = argv[++i];
    else if (key === "--browser") opts.browser = argv[++i];
    else if (key === "--help" || key === "-h") opts.help = true;
  }
  return opts;
}

function usage() {
  console.log(`preview.css の見た目チェック

  npm run build && npm run preview   # 別ターミナルで起動しておく
  npm run check:preview [-- --url http://localhost:4321] [--page /about/]

CMS のプレビューには Tailwind の preflight が無いので、記事ページでサイトの
スタイルを無効化し（＝ブラウザ既定 + preview.css だけ）、サイトの記事と同じ
計算値になるかをライト / ダークの両方で突き合わせます。`);
}

function findBrowser(explicit) {
  if (explicit) return explicit;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [];
  if (process.platform === "win32") {
    for (const base of [process.env["ProgramFiles(x86)"], process.env.ProgramFiles, process.env.LOCALAPPDATA]) {
      if (!base) continue;
      candidates.push(
        path.join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(base, "Google", "Chrome", "Application", "chrome.exe"),
      );
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
    );
  }
  return candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

async function waitForPort(profileDir, timeoutMs = 20000) {
  const file = path.join(profileDir, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const [port] = fs.readFileSync(file, "utf8").split("\n");
      if (port) return Number(port);
    } catch {}
    await sleep(150);
  }
  throw new Error("ブラウザの起動を待てませんでした（DevToolsActivePort が読めません）");
}

async function connect(port) {
  let target = null;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch {}
    await sleep(200);
  }
  if (!target) throw new Error("デバッグ対象のページが見つかりません");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");

  const evaluate = async (expression, awaitPromise = false) => {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (res.exceptionDetails) {
      throw new Error("ページ内でエラー: " + JSON.stringify(res.exceptionDetails.exception));
    }
    return res.result.value;
  };

  return { send, evaluate, close: () => ws.close() };
}

function compare(siteText, previewText) {
  const site = siteText.split("\n");
  const preview = previewText.split("\n");
  const found = [];
  const n = Math.max(site.length, preview.length);
  for (let i = 0; i < n; i++) {
    if (site[i] === preview[i]) continue;
    if (site[i] === undefined || preview[i] === undefined) {
      found.push(`  ${i + 1}行目: ${site[i] === undefined ? "preview のみ" : "サイトのみ"}に存在`);
      continue;
    }
    const a = site[i].split("|");
    const b = preview[i].split("|");
    const detail = [];
    for (let k = 3; k < Math.max(a.length, b.length); k++) {
      if (a[k] !== b[k]) detail.push(`      ${a[k]}  →  ${b[k]}`);
    }
    found.push(`  [${a.slice(0, 3).join("|")}]\n${detail.join("\n")}`);
  }
  return found;
}

async function runMode({ cdp, url, dark }) {
  const label = dark ? "DARK " : "LIGHT";
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }],
  });
  await cdp.send("Page.navigate", { url });
  await sleep(1500);
  await cdp.evaluate("document.fonts.ready", true);

  const setup = await cdp.evaluate(SETUP);
  if (setup !== "ok") {
    throw new Error(`.prose が見つかりません（--page で記事ページを指定してください）: ${url}`);
  }
  await sleep(200);

  const site = await cdp.evaluate(DUMP);
  const info = JSON.parse(await cdp.evaluate(INJECT, true));
  const disabled = await cdp.evaluate(DISABLE_SITE);
  await sleep(400);
  const preview = await cdp.evaluate(DUMP);

  // .prose 自身は対象外（サイト側は Tailwind の余白ユーティリティが付くため）
  const cut = (text) => text.split("\n").slice(1).join("\n");
  const diffs = compare(cut(site), cut(preview));

  console.log(
    `${label}  ページのダーク判定=${info.pageIsDark}  preview.css=${info.sheetLoaded ? "読込OK" : "読込失敗"}  ` +
      `Noto Sans JP=${info.notoSansLoaded ? "OK" : "未読込"}  無効化したサイト側スタイル=${disabled}件`,
  );
  if (!info.sheetLoaded) {
    console.log("  preview.css を読み込めませんでした（/admin/preview.css が配信されているか確認）");
  }
  if (diffs.length === 0) {
    console.log("  一致 ✓（preview.css だけでサイトの記事と同じ計算値）");
  } else {
    console.log(`  差分 ${diffs.length} 件:`);
    console.log(diffs.join("\n"));
  }
  return diffs.length;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return 0;
  }

  const pageUrl = new URL(opts.page, opts.url).toString();
  console.log("preview.css の見た目チェック（Tailwind preflight の無い環境で記事本文と比較）");
  console.log(`  接続先: ${opts.url}`);
  console.log(`  ページ: ${opts.page}`);

  try {
    const res = await fetch(pageUrl);
    if (!res.ok) throw new Error(String(res.status));
  } catch (err) {
    console.log(`\n接続できません: ${pageUrl}`);
    console.log("先に別ターミナルで `npm run build && npm run preview` を実行してください。");
    return 1;
  }

  const browser = findBrowser(opts.browser);
  if (!browser) {
    console.log("\nChrome / Edge が見つかりませんでした。--browser <path> か CHROME_PATH で指定してください。");
    return 1;
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "check-preview-css-"));
  const child = spawn(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDir}`,
      "--window-size=1280,1000",
      pageUrl,
    ],
    { stdio: "ignore" },
  );

  let cdp;
  let failed = 0;
  try {
    const port = await waitForPort(profileDir);
    cdp = await connect(port);
    failed += await runMode({ cdp, url: pageUrl, dark: false });
    failed += await runMode({ cdp, url: pageUrl, dark: true });
    console.log(failed === 0 ? "\n=> すべて一致しました" : `\n=> 差分が ${failed} 件あります`);
  } finally {
    try {
      cdp?.close();
    } catch {}
    child.kill();
    await sleep(300);
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("エラー: " + err.message);
    process.exit(1);
  });
