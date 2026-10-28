# TECHNO-METAL — ROBOT PRODUCTION HISTORY

Public static snapshot, using one canonical Server Analysis dataset for all production totals, history and Part analysis.

- Recorded production: 735,729 PCS / 1,436 Part segments / 25 Part identities / 11 robots.
- Latest source record: 2026-10-28 17:06:46 Asia/Bangkok. This is the actual snapshot, not an exact 17:00:00 cutoff. Current-day totals are not closed-shift totals.
- Coverage2026-08-20..2026-10-28; missing whole dates September17 and18. Missing data is not zero production.
- One displayed average basis: PCS-weighted run time after Server-rule outlier exclusion. SEC/PC and PCS/hr use the same retained records.
- At all history: 53.0564756 SEC/PC and67.8522265 PCS/hr;1,311 runs /707,969 PCS contribute.125 runs /27,760 PCS are excluded from average calculations only; recorded production remains735,729 PCS /1,436 runs.
- Active date/robot/shift/profile/Part filters are applied first. Outlier selection is then recomputed separately for each Part/profile. Overview pools retained rows across Parts; it does not fit one threshold across dissimilar Parts.
- DAY/NIGHT and robot breakdowns reuse that Part's retained mask for the current selection. They are adjusted values, unlike the Server's original raw DAY/NIGHT display.
- Per-Part Server rule: with at least5runs and500PCS, PCS-weighted median of rounded run SEC/PC; retain rates within max(6seconds,18% of median,4×1.4826×weighted MAD). Fewer samples retain eligible runs; an empty retained set falls back to eligible runs. Server/Python two-decimal rounding and the Server median helper's exclusion of zero deviations are reproduced.
- Empty/missing/invalid rate inputs show —, not an invented zero. Exclusion does not prove a run was a programming trial. No operational trial flag is available to separate such activity perfectly.
- Report dates preserve overnight shift ownership. Part identity includes J/K, C/T or S/C. Repeated Part segments remain separate runs.
- The page defaults to all history. Filters change real totals, not a hardcoded display.
- Thai, English and Japanese. No recommended targets, median comparison or competing raw-average comparison.

Only approved production-report fields and company logo are included. No raw databases, controller files, programs, credentials, private network addresses or personnel data.

For Android use the verified HTTPS report: https://natapong09tb-cyber.github.io/production-history/ . File-manager content:// access may fail to load sibling assets; offline Android operation is not verified.
