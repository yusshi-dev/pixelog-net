import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { glob } from "astro/loaders";

const REPO_URL = "https://github.com/yusshi-dev/pixelog-net-content";
const CONTENT_DIR = path.resolve(process.cwd(), "content");

// CI（Cloudflare など）では取得失敗を握りつぶさずビルドを落とす
const IS_CI = Boolean(process.env.CI || process.env.WORKERS_CI || process.env.CF_PAGES);

// 1プロセス内での重複実行を防ぐフラグ
let isInitialized = false;

/**
 * Wrap Astro's glob loader, keeping ./content in sync with the repo.
 */
export function github(pattern: string | string[], base: string) {
  ensureContentRepo();
  return glob({ pattern, base });
}

/**
 * private リポジトリ用の認証ヘッダ。CONTENT_REPO_TOKEN がある場合のみ付与する。
 * トークンを remote URL に埋め込まず http.extraheader 経由で渡すので、
 * .git/config やログにトークンが残らない。
 */
function authArgs(): string[] {
  const token = process.env.CONTENT_REPO_TOKEN;
  if (!token) return [];
  const basic = Buffer.from(`x-access-token:${token}`).toString("base64");
  return ["-c", `http.extraheader=Authorization: Basic ${basic}`];
}

function git(args: string[], cwd?: string) {
  execFileSync("git", [...authArgs(), ...args], {
    cwd,
    stdio: "inherit",
  });
}

function ensureContentRepo() {
  if (isInitialized) return;

  try {
    // 1. 正常なGitリポジトリかつリモートが一致している場合 -> pullして終了
    if (isGitRepo(CONTENT_DIR) && isCorrectRemote(CONTENT_DIR, REPO_URL)) {
      try {
        git(["pull"], CONTENT_DIR);
        isInitialized = true;
        return;
      } catch {
        // pull失敗時はフォールバックとしてクローンし直す
      }
    }

    // 2. 異常な状態、または既存ディレクトリが不正な場合 -> 初期化してクローン
    reclone();
    isInitialized = true;
  } catch (err) {
    isInitialized = true;

    // CI では失敗を隠さない（空のコンテンツでデプロイされるのを防ぐ）
    if (IS_CI) {
      throw new Error(
        "content リポジトリの取得に失敗しました。CONTENT_REPO_TOKEN の設定を確認してください。",
        { cause: err },
      );
    }

    console.warn(
      "[github] content リポジトリの取得に失敗しました。空の content でビルドを続行します。",
      err,
    );
  }
}

function isGitRepo(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: dir,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function isCorrectRemote(dir: string, expectedUrl: string): boolean {
  try {
    const out = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: dir,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();

    const normalize = (u: string) => u.replace(/\.git$/, "").toLowerCase();
    return normalize(out) === normalize(expectedUrl);
  } catch {
    return false;
  }
}

function clone() {
  fs.mkdirSync(path.dirname(CONTENT_DIR), { recursive: true });
  git(["clone", REPO_URL, CONTENT_DIR]);
}

function reclone() {
  if (fs.existsSync(CONTENT_DIR)) {
    try {
      fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
    } catch {
      // 削除失敗時はリネームによる退避を試みる
      try {
        const backup = `${CONTENT_DIR}.bak-${Date.now()}`;
        fs.renameSync(CONTENT_DIR, backup);
        // バックアップの削除は非同期、または失敗を許容する
        fs.rm(backup, { recursive: true, force: true }, () => {});
      } catch {
        // どちらも失敗した場合はcloneの失敗に委ねる
      }
    }
  }
  clone();
}
