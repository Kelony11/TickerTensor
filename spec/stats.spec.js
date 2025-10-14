import { stats_per_window, mean, standard_deviation, windows } from "../src/stats.js";
import { count_peaks, count_troughs } from "../src/peaks.js";

// A jasmine test suite for stats.js
describe("Functional stats calculations", () => {

  // Test 1: stats_per_window() returns the right shape & values 
  it("stats_per_window returns objects with means, stddev, peaks, troughs, length", () => {
    const series = [1, 3, 2, 5, 4, 6, 5, 7, 6];

    // window_size = 3, step = 1.
    // Windows: [1,3,2], [3,2,5], [2,5,4], [5,4,6], [4,6,5], [6,5,7], [5,7,6]
    const result = stats_per_window(series, 3, 1, false);
    expect(result.length).toBe(7);

    expect(result[0].mean).toBeCloseTo(2.0, 10); // mean([1,3,2]) = 2
    expect(result[1].mean).toBeCloseTo(3.3333333333, 10); // mean([3,2,5])

    // For [2,5,4]: one peak (5), zero troughs
    expect(result[2]).toEqual(
      jasmine.objectContaining({ peaks: 1, troughs: 0, length: 3 })
    );
  });

  // Test 2: count_peaks() and count_troughs() on known series
  it("counts peaks and troughs correctly (zero-based indexing, endpoints ignored)", () => {
    const series = [1, 3, 2, 5, 4, 6, 5, 7, 6]; // peaks at 1,3,5,7; troughs at 2,4,6
    expect(count_peaks(series)).toBe(4);
    expect(count_troughs(series)).toBe(3);
  });

  // Test 3: windows() overlapping vs non-overlapping 
  it("windows generates overlapping and non-overlapping windows correctly", () => {
    const series = [1, 2, 3, 4, 5, 6];

    // Overlapping windows of size 3, step 1: [1,2,3], [2,3,4], [3,4,5], [4,5,6]
    const overlapping = windows(series, 3, 1);
    expect(overlapping.length).toBe(4);
    expect(overlapping[0]).toEqual([1, 2, 3]);
    expect(overlapping[3]).toEqual([4, 5, 6]);

    // Non-overlapping windows of size 3, step 3: [1,2,3], [4,5,6]
    const non_overlapping = windows(series, 3, 3);
    expect(non_overlapping.length).toBe(2);
    expect(non_overlapping[0]).toEqual([1, 2, 3]);
    expect(non_overlapping[1]).toEqual([4, 5, 6]);
  });

  // Test 4: standard deviation population vs sample data
  it("standard_deviation computes population vs sample stddev correctly", () => {
    const series = [4, 4, 1, 5, 9, 7, 2, 6, 5];

    // population σ ≈ 2.2986845406 ; sample σ ≈ 2.4381231397
    expect(standard_deviation(series, false)).toBeCloseTo(2.2986845406, 10);
    expect(standard_deviation(series, true)).toBeCloseTo(2.4381231397, 10);
  });

  // Test 5: mean() correctness & robustness 
  it("mean handles empty arrays and mixed values correctly", () => {
    expect(Number.isNaN(mean([]))).toBeTrue(); // empty array
    expect(mean([1, 2, 3, 4, 5])).toBe(3); // normal case
    expect(mean(["$4.00", "2", "3.00"])).toBeCloseTo(3.0, 10); // coercible strings

    // Non-numeric values are ignored; valid numbers remain → mean = (1+3+4)/3
    expect(mean([1, "two", 3, null, 4])).toBeCloseTo(8 / 3, 10);
  });

    // Test 6: edge cases for stats_per_window()
  it("overlap vs non-overlap window counts", () => {
    const arr = Array.from({length: 15}, (_,i)=>i+1);
    expect(stats_per_window(arr, 3, 1).length).toBe(13);
    expect(stats_per_window(arr, 3, 3).length).toBe(5);
  });

    // Test 7: constant series edge case
  it("constant series: σ=0 and no extrema", () => {
    const arr = Array(10).fill(42);
    const [w] = stats_per_window(arr, 10, 10);
    expect(w.standard_deviation ?? w.stddev).toBeCloseTo(0, 10);
    expect(w.peaks).toBe(0);
    expect(w.troughs).toBe(0);
  });

});
