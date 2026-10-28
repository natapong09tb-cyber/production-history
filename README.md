# TECHNO-METAL Production History & Analysis

A public, static report using one canonical Server Analysis dataset throughout overview, history table and Part analysis. Not live data.

- 1,434 eligible Part segments / runs, 734,591 PCS, 25 distinct Part identities.
- The same filtered rows drive every displayed total and average. One row is a Part segment for a robot, report date and shift, not a whole-shift report.
- Excludes the source integrity-warning record, then selects one STANDARD/EXTENDED view per robot/date/shift using the Server Analysis policy (largest summed Part quantity, extended-view tie preference).
- Repeated Part runs in the same robot/shift remain separate segments.
- All 1,434 selected segments have positive recorded quantity and time.
- All-history recorded seconds: 39,418,200. Weighted AVG SEC/PC 53.6600639; AVG PCS/hr 67.0889995.
- October 28 available DAY data: 4,030 PCS / 11 runs. Date/shift/robot/Part filters change the totals; 734,591 is not a fixed display value.
- Report-date coverage: 2026-08-20 through 2026-10-28 (68 dates). Complete missing dates: September 17 and September 18. Missing data is not zero production.
- Latest source record: 2026-10-28 14:50:23 Asia/Bangkok. Requested limit: 15:00; the final 9 minutes 37 seconds are unavailable. Current-day shifts are incomplete.
- AVG SEC/PC = sum recorded run seconds / sum paired PCS; AVG PCS/hr = 3600 * sum PCS / sum recorded seconds. Weighted robot report-time rates, not factory wall-clock throughput or verified active-motion time. Missing or ineligible rate inputs display —; no time is invented.
- Report dates preserve Server ownership, including overnight shifts. No date reassignment at midnight.
- Part identity includes J/K, C/T or S/C. Equal part numbers across profiles are not merged.
- The page defaults to all available history. Date, robot, shift, profile and Part filters narrow the same canonical dataset.
- Thai, English and Japanese interface. No recommended targets.

Only approved production-report fields and the company logo are included. No raw databases, controller files, programs, credentials, private network addresses or personnel data.
