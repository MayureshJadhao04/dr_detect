function analysis = generatePatientReport(net1, net2, patientInfo, leftImgPath, rightImgPath, outPdfPath)
% generatePatientReport  Convenience wrapper: analyze + render in one
% call. Kept for quick standalone testing (e.g. from the Command
% Window) so existing test calls keep working unchanged.
%
% In the actual app, do NOT use this -- use the two-step flow instead:
%   analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath);
%   -- show analysis on screen here --
%   savePatientVisit(analysis, patientInfo);   -- writes report.pdf + all else
%
%   generatePatientReport(net1, net2, patientInfo, leftImgPath, ...
%       rightImgPath, outPdfPath)
%
% Returns the analysis struct too, in case you want to inspect it after
% a quick test render.

    analysis = analyzePatientVisit(net1, net2, leftImgPath, rightImgPath);
    renderPatientReportPDF(analysis, patientInfo, outPdfPath);
end