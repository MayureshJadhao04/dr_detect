function theme = uiTheme()
% uiTheme  Central color/font palette for the DR Screen app. Every
% screen should pull colors from here, not hardcode hex values, so a
% palette tweak only ever needs to happen in one place.
%
% CONFIRMED values are reused as-is from generatePatientReport.m's PDF
% spec (same hex, not re-guessed) so the live app and the PDF report a
% patient/doctor sees look like one product. ESTIMATED values were
% read off the supplied mockup screenshot -- JPEG compression means
% these are approximate, correct them here if they're off and every
% screen picks up the fix automatically.

theme.textPrimary    = hex2rgbLocal('#17243A');  % CONFIRMED (PDF report)
theme.textSecondary  = hex2rgbLocal('#64748B');  % CONFIRMED (PDF report)
theme.panelBg        = hex2rgbLocal('#F8FAFC');  % CONFIRMED (PDF report)
theme.border         = hex2rgbLocal('#CBD5E1');  % CONFIRMED (PDF report)

theme.contentBg       = hex2rgbLocal('#F1F5F9'); % ESTIMATE -- main app background behind cards
theme.cardBg          = hex2rgbLocal('#FFFFFF');
theme.sidebarBg       = hex2rgbLocal('#0F172A'); % ESTIMATE -- dark navy sidebar
theme.sidebarText     = hex2rgbLocal('#CBD5E1'); % ESTIMATE -- muted sidebar nav text
theme.sidebarActiveBg = hex2rgbLocal('#1D4ED8'); % ESTIMATE -- active nav item fill
theme.sidebarSubtext  = hex2rgbLocal('#64748B'); % ESTIMATE -- "Early Detection..." tagline
theme.logoAccent      = hex2rgbLocal('#2DD4BF'); % ESTIMATE -- teal eye icon

theme.successText = hex2rgbLocal('#16A34A'); theme.successBg = hex2rgbLocal('#DCFCE7');
theme.warningText = hex2rgbLocal('#B45309'); theme.warningBg = hex2rgbLocal('#FEF3C7');
theme.dangerText  = hex2rgbLocal('#DC2626'); theme.dangerBg  = hex2rgbLocal('#FEE2E2');

theme.primaryBtnBg   = theme.textPrimary;             % dark navy (Send Report / Add New Patient)
theme.primaryBtnText = hex2rgbLocal('#FFFFFF');

theme.fontName = pickFontLocal();

theme.fontSizeTitle   = 20;
theme.fontSizeSection = 15;
theme.fontSizeBody    = 12;
theme.fontSizeLabel   = 10;
end


%% ========================================================================
function rgb = hex2rgbLocal(hex)
% Local copy, not a call into generatePatientReport.m's internal
% hex2rgb() -- kept self-contained here deliberately so uiTheme.m has
% no dependency on another file's private/local functions. If you've
% already pulled hex2rgb() out into its own functions\hex2rgb.m file,
% tell me and I'll switch this to call that instead of duplicating it.
hex = char(hex);
if hex(1) == '#'
    hex = hex(2:end);
end
rgb = [hex2dec(hex(1:2)) hex2dec(hex(3:4)) hex2dec(hex(5:6))] / 255;
end

function fontName = pickFontLocal()
% Local copy of the same Inter->Arial fallback logic used in
% generatePatientReport.m, for the same self-containment reason above.
available = listfonts();
if any(strcmpi(available, 'Inter'))
    fontName = 'Inter';
else
    fontName = 'Arial';
end
end
