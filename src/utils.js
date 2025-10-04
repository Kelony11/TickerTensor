import fs from "fs";
import path from "path";

/* ---------- helpers: csv + header + date ---------- */

function detect_delimiter(header_line) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let max_hits = -1;
  for (const d of candidates) {
    const hits = (header_line.match(new RegExp("\\" + d, "g")) || []).length;
    if (hits > max_hits) { max_hits = hits; best = d; }
  }
  return best;
}

function split_line(line, delim) {
  const cols = [];
  let cur = "";
  let in_quotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i - 1] !== "\\") { in_quotes = !in_quotes; continue; }
    if (ch === delim && !in_quotes) { cols.push(cur); cur = ""; }
    else { cur += ch; }
  }
  cols.push(cur);
  return cols.map((s) => s.trim().replace(/^\uFEFF/, "").replace(/^"|"$/g, ""));
}

function normalize_header(h) {
  const s = String(h).trim().toLowerCase();
  if (s.includes("date")) return "Date";
  if (
    s === "close" ||
    s === "adj close" ||
    s.includes("close/last") ||
    s.includes("adjusted close") ||
    s === "last" ||
    s.includes("close price") ||
    s.includes("closing price")
  ) {
    return "Close";
  }
  return h;
}

function to_iso_date(s) {
  if (!s) return null;
  let v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // YYYY-MM-DD
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v); // M/D/YYYY
  if (mdy) {
    const m = String(mdy[1]).padStart(2, "0");
    const d = String(mdy[2]).padStart(2, "0");
    const y = mdy[3];
    return `${y}-${m}-${d}`;
  }
  const dt = new Date(v);
  if (!isNaN(dt)) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function coerce_close(v) {
  if (v == null) return NaN;
  return Number(String(v).replace(/[$,\s]/g, ""));
}

/* ---------- core: parse one CSV string to row objects ---------- */

export function read_csv(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const delim = detect_delimiter(lines[0]);
  const raw_headers = split_line(lines[0], delim);
  const headers = raw_headers.map(normalize_header);
  const headers_lc = headers.map((h) => String(h).toLowerCase());

  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split_line(lines[i], delim);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
    // lower-cased view (convenience if needed later)
    row.__lower = {};
    headers.forEach((h, idx) => { row.__lower[headers_lc[idx]] = cols[idx] ?? ""; });
    out.push(row);
  }
  return out; // e.g., [{ Date: '2025-01-02', Close: '192.1', ...}, ...]
}

/* ---------- directory: return { TICKER: [{date, close}], ... } ---------- */

export function read_csv_dir(dir_path) {
  const files = fs
    .readdirSync(dir_path)
    .filter((f) => path.extname(f).toLowerCase() === ".csv")
    .sort();

  if (files.length === 0) throw new Error(`No CSV files found in directory: ${dir_path}`);

  const map = {};
  for (const f of files) {
    const ticker = path.basename(f, path.extname(f)).toUpperCase();
    const content = fs.readFileSync(path.join(dir_path, f), "utf8");
    const rows = read_csv(content);

    const normalized = [];
    for (const r of rows) {
      // prefer canonical keys first, then fallbacks via __lower
      const date_raw =
        r.Date ??
        r.__lower?.date ??
        r["DATE"] ??
        r.__lower?.["trade date"] ??
        r.__lower?.["date/time"] ??
        null;

      const close_raw =
        r.Close ??
        r.__lower?.close ??
        r.__lower?.["adj close"] ??
        r.__lower?.["adjusted close"] ??
        r.__lower?.["close/last"] ??
        r.__lower?.last ??
        null;

      const date = to_iso_date(date_raw);
      const close = coerce_close(close_raw);
      if (!date || !isFinite(close)) continue;

      normalized.push({ date, close });
    }

    // sort oldest → newest
    normalized.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    map[ticker] = normalized;
  }

  return map; // { TICKER: [{date, close}, ...], ... }
}

/* ---------- math: dates intersection + matrix ---------- */

export function intersect_dates(by_ticker) {
  const tickers = Object.keys(by_ticker);
  if (tickers.length === 0) return [];

  let common = new Set(by_ticker[tickers[0]].map((r) => r.date));
  for (const t of tickers.slice(1)) {
    const s = new Set(by_ticker[t].map((r) => r.date));
    common = new Set([...common].filter((d) => s.has(d)));
  }
  return [...common].sort(); // assumes ISO
}

export function to_matrix(by_ticker) {
  const dates = intersect_dates(by_ticker);
  const tickers = Object.keys(by_ticker).sort();

  const hash_map = {};
  for (const t of tickers) {
    hash_map[t] = new Map(by_ticker[t].map(({ date, close }) => [date, close]));
  }

  const matrix = dates.map((d) => tickers.map((t) => hash_map[t].get(d)));


  return { dates, tickers, matrix };
}

