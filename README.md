# TECHNO-METAL Production History & Analysis

Public, static snapshot with two distinct source-backed views. Not live Server data.

## Shift history
- 1,359 canonical robot/date/shift records, 698,412 pieces; October 28 DAY: 4,031 pieces.
- Report-date coverage: 2026-08-20 through 2026-10-28 (68 dates). Complete missing dates in this store: September 17 and September 24.
- 107 duplicate STANDARD/EXTENDED views removed using the Server shift-history selection policy.
- 1,339 full records, 19 partial backfill records, 1 recovered/unallocated record. History averages use only eligible full-report rows with positive paired quantity and recorded time. The interface shows contributing PCS and row coverage; excluded quantities remain in the production total. Per-row missing/ineligible rates remain unavailable.
- Part-filtered history totals exclude 58 transition pieces and one unallocated recovered piece. Unknown Part entries remain separate from known identities.

## Server Analysis
- Separate Analysis archive, not a reaggregation of the shift-history table: 1,434 eligible Part segments, 734,591 pieces, 25 known Part identities.
- Excludes the source integrity-warning record, then selects one STANDARD/EXTENDED view per robot/date/shift using the Server Analysis policy (largest summed Part quantity, extended-view tie preference).
- All 1,434 selected segments have positive recorded quantity and time. Segment identity is preserved, including repeated Part runs in the same robot/shift.
- 39,418,200 recorded seconds: weighted AVG SEC/PC 53.6600639; weighted AVG PCS/hr 67.0889995 across all available Analysis history.
- Coverage: 2026-08-20 through 2026-10-28 (68 dates). Complete missing dates in this store: September 17 and September 18.
- The two stores have different coverage and view-selection rules. Their totals and record counts are not interchangeable and are not added together.
- No recommended targets are displayed.

## Shared definitions and privacy
- Latest source record: 2026-10-28 14:50:23 Asia/Bangkok. Requested limit: 15:00; the final 9 minutes 37 seconds are unavailable in this snapshot.
- Missing robot/date/shift data is not assumed to be zero. Current-day shifts are incomplete.
- AVG SEC/PC = sum recorded report seconds / sum pieces; AVG PCS/hr = 3600 * sum pieces / sum recorded report seconds. These weighted rates use cumulative robot report time, not factory wall-clock throughput or verified active-motion time.
- Report dates preserve Server ownership, including overnight shifts. No date reassignment at midnight.
- Part identity includes J/K, C/T or S/C; equal part numbers across profiles are not merged.
- The all-history Part action clears date, robot, shift and profile restrictions while preserving the selected Part.
- Shift-history first/last times remain robot/shift-level, not selected-Part timing.
- Thai, English and Japanese interface; data identifiers remain unchanged.

Only approved production-report fields and the company logo are included. No raw databases, controller files, programs, credentials, private network addresses or personnel data.

All-history eligible History rates: 688,165 PCS from 1,278 contributing rows, 36,851,820 seconds; 53.550849 SEC/PC and 67.225825 PCS/hr. These are explicitly a subset, not rates for all 698,412 PCS.
