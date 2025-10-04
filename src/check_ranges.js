import path from "path";
import { fileURLToPath } from "url";
import { read_csv_dir } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input_folder = process.argv[2] || path.join(__dirname, "..", "data", "real");

try {
  const by_ticker = read_csv_dir(input_folder);
  const tickers = Object.keys(by_ticker).sort();

  if (!tickers.length) throw new Error("No CSVs found.");

  const ranges = tickers.map((t) => {
    const rows = by_ticker[t];
    const first = rows[0]?.date;
    const last = rows[rows.length - 1]?.date;
    return { t, n: rows.length, first, last };
  });

  console.log(`Files: ${tickers.length}`);
  console.log("Per-ticker ranges:");
  ranges.forEach((r) =>
    console.log(`  ${r.t}: ${r.n} rows | ${r.first ?? "—"} → ${r.last ?? "—"}`)
  );

  const non_empty = ranges.filter((r) => r.n > 0);
  if (!non_empty.length) {
    console.log("\n⚠️ All files parsed 0 rows. Check headers/delimiters.");
    process.exit(2);
  }

  const max_first = non_empty.reduce(
    (a, r) => (a > r.first ? a : r.first),
    non_empty[0].first
  );
  const min_last = non_empty.reduce(
    (a, r) => (a < r.last ? a : r.last),
    non_empty[0].last
  );

  console.log(`\nGlobal overlap window (non-empty only): ${max_first} → ${min_last}`);
  if (max_first > min_last) {
    console.log("\n⚠️ No overlapping window across non-empty files.");
  } else {
    console.log(
      "\n✅ There is an overlap window. If intersection is zero, some tickers lack dates inside that window."
    );
  }
} catch (e) {
  console.error("[check_ranges] " + e.message);
  process.exit(1);
}
