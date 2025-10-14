// index2.js (ESM, snake_case)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stats_per_window, range } from "./stats.js";

// ---- CSV reader (wide format: Date,T1,T2,...) ----
const parse_wide_format = (csv_text) => {
  const lines = csv_text.split(/\r?\n/).filter((ln) => ln.trim() !== "");
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((ln) => ln.split(",").map((c) => c.trim()));

  // sort by date ascending (assumes ISO-ish date in col 0)
  const sorted = rows
    .map((r) => ({ raw: r, t: new Date(r[0]).getTime() }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t)
    .map((x) => x.raw);

  return { headers, rows: sorted };
};

// table -> { TICKER: number[] }
const extract_series_per_ticker = ({ headers, rows }) =>
  headers.slice(1).reduce((acc, ticker, idx) => {
    const col = idx + 1;
    const values = rows
      .map((r) => r[col])
      .map((v) => (v === "" ? NaN : parseFloat(String(v).replace(/[$,]/g, ""))))
      .filter((n) => Number.isFinite(n));
    return { ...acc, [ticker]: values };
  }, {});

// ---- CLI plumbing ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , csv_path_arg, overlap_step_arg] = process.argv;

// Default to a **file** (wide CSV), not a directory:
const csv_path = csv_path_arg
  ? path.resolve(process.cwd(), csv_path_arg)
  : path.resolve(__dirname, "..", "data", "stocks.csv"); // place your wide CSV here

const overlap_step = Math.max(1, parseInt(overlap_step_arg ?? "1", 10) || 1);

const sizes_arg = process.argv[4];
const window_sizes = sizes_arg
  ? sizes_arg.split(",").map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n > 0)
  : [50, 200, 2000]; // per assignment

// Validate path
if (!fs.existsSync(csv_path)) {
  console.error(`CSV not found: ${csv_path}`);
  process.exit(1);
}
if (fs.statSync(csv_path).isDirectory()) {
  console.error(
    `Expected a single wide CSV file (Date,T1,T2,...). Got a directory: ${csv_path}\n` +
      `Either pass a CSV path explicitly, e.g.: node src/index2.js ./data/real/stocks.csv\n` +
      `or wire this script to your HW1 directory reader in utils.js.`
  );
  process.exit(1);
}

// Read & parse
const csv_text = fs.readFileSync(csv_path, "utf8");
const table = parse_wide_format(csv_text);
const by_ticker = extract_series_per_ticker(table);


// ---- header summary (added) ----
const dates = table.rows.map((r) => r[0]);
const start = dates[0];
const end = dates[dates.length - 1];
const tickers = Object.keys(by_ticker);
const firstLen = tickers.length ? by_ticker[tickers[0]].length : 0;
console.log(
  `start-date: ${start}, end-date: ${end}, companies: ${tickers.length}, points-per-series: ${firstLen}`
);

// ---- helpers (added r4 + refined fmt_range) ----
const r4 = (x) => (Number.isFinite(x) ? x.toFixed(4) : "NaN");
const fmt_range = (r) =>
  r && Number.isFinite(r.min) && Number.isFinite(r.max) ? `[${r4(r.min)}, ${r4(r.max)}]` : "[NaN, NaN]";



const summarize = (series, size, step) => {
  const windows_stats = stats_per_window(series, size, step, /*use_sample_std=*/ false);
  // { mean, standard_deviation|stddev|stdev, peaks, troughs, length }
  const means = windows_stats.map((w) => w.mean);
  const stdevs = windows_stats.map((w) => w.standard_deviation ?? w.stddev ?? w.stdev);

  const mean_range = range(means);
  const std_range = range(stdevs);

  const total_peaks = windows_stats.map((w) => w.peaks).reduce((a, b) => a + b, 0);
  const total_troughs = windows_stats.map((w) => w.troughs).reduce((a, b) => a + b, 0);

  return {
    num_windows: windows_stats.length,
    range_of_means: mean_range,
    range_of_stddevs: std_range,
    total_peaks,
    total_troughs,
  };
};

// ---- Print summaries ----
Object.entries(by_ticker).forEach(([ticker, series]) => {
  console.log(`\nTicker: ${ticker} (n=${series.length})`);

  window_sizes
    .filter((sz) => sz <= series.length)
    .forEach((size) => {
      const overlap = summarize(series, size, overlap_step);
      const non_overlap = summarize(series, size, size);

      console.log(
        `  Window ${size} (overlap step=${overlap_step}): ` +
          `windows=${overlap.num_windows} | μ-range=${fmt_range(overlap.range_of_means)} | ` +
          `σ-range=${fmt_range(overlap.range_of_stddevs)} | peaks=${overlap.total_peaks} | troughs=${overlap.total_troughs}`
      );
      console.log(
        `  Window ${size} (no overlap): ` +
          `windows=${non_overlap.num_windows} | μ-range=${fmt_range(non_overlap.range_of_means)} | ` +
          `σ-range=${fmt_range(non_overlap.range_of_stddevs)} | peaks=${non_overlap.total_peaks} | troughs=${non_overlap.total_troughs}`
      );
    });
});
