import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { glob } from "astro/loaders";

const REPO_URL = "https://github.com/yusshi-dev/pixelog-net-content";
const CONTENT_DIR = path.resolve(process.cwd(), "content");

// 1プロセス内での重複実行を防ぐフラグ
let isInitialized = false;

/**
 * Wrap Astro's glob loader, keeping ./content in sync with the repo.
 */
export function github(pattern: string | string[], base: string) {
  ensureContentRepo();
  return glob({ pattern, base });
}

function ensureContentRepo() {
  if (isInitialized) return;

  try {
    // 1. 正常なGitリポジトリかつリモートが一致している場合 -> pullして終了
    if (isGitRepo(CONTENT_DIR) && isCorrectRemote(CONTENT_DIR, REPO_URL)) {
      try {
        execSync("git pull", { cwd: CONTENT_DIR, stdio: "inherit" });
        isInitialized = true;
        return;
      } catch {
        // pull失敗時はフォールバックとしてクローンし直す
      }
    }

    // 2. 異常な状態、または既存ディレクトリが不正な場合 -> 初期化してクローン
    reclone();
    isInitialized = true;
  } catch (_err) {
    // 最終防衛策: 再度クローンを試みるが、失敗してもプロセスは落とさない
    try {
      reclone();
      isInitialized = true;
    } catch {
      // 設定評価のクラッシュを防ぐためエラーをイン swallow
    }
  }
}

function isGitRepo(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  try {
    execSync("git rev-parse --is-inside-work-tree", {
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
    const out = execSync("git remote get-url origin", {
      cwd: dir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    const normalize = (u: string) => u.replace(/\.git$/, "").toLowerCase();
    return normalize(out) === normalize(expectedUrl);
  } catch {
    return false;
  }
}

function clone() {
  fs.mkdirSync(path.dirname(CONTENT_DIR), { recursive: true });
  
  // パスの空白対策として、安全にダブルクォートで囲む（エスケープ済みのパスに対応）
  const escapedPath = CONTENT_DIR.replace(/(["\s'$`\\])/g, "\\$1");
  execSync(`git clone "${REPO_URL}" "${escapedPath}"`, { stdio: "inherit" });
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