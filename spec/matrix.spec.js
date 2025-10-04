/* eslint-env jasmine */
import path from "path";
import { fileURLToPath } from "url";
import { read_csv_dir, to_matrix } from "../src/utils.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleDir = path.join(__dirname, "..", "data", "sample");

describe("matrix", () => {

    //N×M matrix, where N is the number of rows of the closing price data series (e.g., 2000 for each company), 
    // and M is the number of columns for different companies

  it("builds N×M matrix aligned by intersecting dates", () => {
    const byTicker = read_csv_dir(sampleDir);
    const { dates, tickers, matrix } = to_matrix(byTicker);

    expect(tickers.length).toBeGreaterThan(0);      // M > 0
    expect(matrix.length).toEqual(dates.length);    // rows = N
    matrix.forEach(r => expect(r.length).toEqual(tickers.length)); // cols = M
  });
});
