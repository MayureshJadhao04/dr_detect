# Context Archive v19 — A4 PDF Report Engine Overhaul (Historical Reference)

Superseded by `CONTEXT_20.md` and `CONTEXT_21.md`.

*Archived for lineage tracing of MATLAB reporting engine overhaul, vector PDF coordinate system unification, and resolution bug fixes.*

---

## Key Technical Decisions from v19:
1. **Unified Coordinate System in `renderPatientReportPDF.m`**:
   - Replaced pixel positioning with single normalized background axes (`bgAx`, `XLim`/`YLim` = `[0 1]`).
   - Sized on-screen figure to 700×990px (exact A4 aspect ratio).
   - Used `print(fig, pdfPath, '-dpdf', '-r300', '-bestfit')` for vector PDF export and `print(fig, pngPath, '-dpng', '-r150')` for companion PNG, avoiding monitor resolution clamping.
2. **Clinical Data Safeguards**:
   - DME row explicitly labeled "Not assessed" (preventing false negative assurance).
   - "Trained on" citation accurately restricted to IDRiD & APTOS2019.
