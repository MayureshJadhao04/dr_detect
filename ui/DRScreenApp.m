function DRScreenApp()
% DRScreenApp  Entry point for the DR Screen desktop app. Builds the
% persistent shell (sidebar navigation + top bar) shown on every page,
% and a content area that swaps between pages without opening new
% windows -- matching the single-page-app feel of the supplied mockup.
%
% STATUS: shell only. Each page's actual content (Screen / Patient
% Records / Doctor Responses / Settings) is a placeholder label for
% now -- intentionally, so the shell itself (colors, spacing, nav
% behavior) can be visually confirmed against the mockup before the
% much larger effort of building the detailed Screen page (patient
% info card, fundus image cards, results card, records table) goes in
% on top of it.
%
% Run with: DRScreenApp

theme = uiTheme();

% ---------- state shared across nested functions ----------
currentPage = "Screen";
navButtons = struct();   % filled in below, keyed by page name
pagePanels = struct();   % filled in below, keyed by page name

% ---------- root figure ----------
fig = uifigure('Name', 'DR Screen', 'Position', [80 60 1536 980], ...
    'Color', theme.contentBg);

root = uigridlayout(fig, [1 2]);
root.ColumnWidth = {240, '1x'};
root.RowHeight = {'1x'};
root.Padding = [0 0 0 0];
root.ColumnSpacing = 0;

% =====================================================================
% SIDEBAR
% =====================================================================
sidebar = uipanel(root, 'BackgroundColor', theme.sidebarBg, 'BorderType', 'none');
sidebar.Layout.Row = 1; sidebar.Layout.Column = 1;

sbGrid = uigridlayout(sidebar, [3 1]);
sbGrid.RowHeight = {110, '1x', 60};
sbGrid.Padding = [0 0 0 0];
sbGrid.RowSpacing = 0;

% --- logo block ---
logoPanel = uipanel(sbGrid, 'BackgroundColor', theme.sidebarBg, 'BorderType', 'none');
logoPanel.Layout.Row = 1; logoPanel.Layout.Column = 1;
logoGrid = uigridlayout(logoPanel, [2 2]);
logoGrid.RowHeight = {28, 16};
logoGrid.ColumnWidth = {40, '1x'};
logoGrid.Padding = [20 20 20 10];
logoGrid.RowSpacing = 2; logoGrid.ColumnSpacing = 10;

logoIcon = uilabel(logoGrid, 'Text', char(9673), 'FontSize', 22, ...
    'FontColor', theme.logoAccent, 'HorizontalAlignment', 'center');
logoIcon.Layout.Row = [1 2]; logoIcon.Layout.Column = 1;

logoTitle = uilabel(logoGrid, 'Text', 'DR Screen', 'FontWeight', 'bold', ...
    'FontSize', 16, 'FontColor', [1 1 1], 'FontName', theme.fontName);
logoTitle.Layout.Row = 1; logoTitle.Layout.Column = 2;

logoSubtitle = uilabel(logoGrid, 'Text', 'Early Detection. Better Vision.', ...
    'FontSize', 9, 'FontColor', theme.sidebarSubtext, 'FontName', theme.fontName);
logoSubtitle.Layout.Row = 2; logoSubtitle.Layout.Column = 2;

% --- nav items ---
navPanel = uipanel(sbGrid, 'BackgroundColor', theme.sidebarBg, 'BorderType', 'none');
navPanel.Layout.Row = 2; navPanel.Layout.Column = 1;
navGrid = uigridlayout(navPanel, [4 1]);
navGrid.RowHeight = {44, 44, 44, '1x'};
navGrid.Padding = [12 8 12 8];
navGrid.RowSpacing = 4;

navButtons.Screen = makeNavButton(navGrid, 1, char(8962) + " Screen", theme);
navButtons.PatientRecords = makeNavButton(navGrid, 2, char(9636) + " Patient Records", theme);
navButtons.DoctorResponses = makeNavButton(navGrid, 3, char(9993) + " Doctor Responses", theme);

navButtons.Screen.ButtonPushedFcn = @(~,~) setActivePage("Screen");
navButtons.PatientRecords.ButtonPushedFcn = @(~,~) setActivePage("PatientRecords");
navButtons.DoctorResponses.ButtonPushedFcn = @(~,~) setActivePage("DoctorResponses");

% --- settings, pinned to bottom ---
settingsPanel = uipanel(sbGrid, 'BackgroundColor', theme.sidebarBg, 'BorderType', 'none');
settingsPanel.Layout.Row = 3; settingsPanel.Layout.Column = 1;
settingsGrid = uigridlayout(settingsPanel, [1 1]);
settingsGrid.Padding = [12 8 12 16];
navButtons.Settings = makeNavButton(settingsGrid, 1, char(9881) + " Settings", theme);
navButtons.Settings.ButtonPushedFcn = @(~,~) setActivePage("Settings");

% =====================================================================
% MAIN AREA (top bar + content)
% =====================================================================
mainArea = uigridlayout(root, [2 1]);
mainArea.Layout.Row = 1; mainArea.Layout.Column = 2;
mainArea.RowHeight = {72, '1x'};
mainArea.Padding = [0 0 0 0];
mainArea.RowSpacing = 0;

% --- top bar ---
topBar = uipanel(mainArea, 'BackgroundColor', theme.cardBg, 'BorderType', 'line', ...
    'BorderColor', theme.border);
topBar.Layout.Row = 1; topBar.Layout.Column = 1;
tbGrid = uigridlayout(topBar, [1 2]);
tbGrid.ColumnWidth = {'1x', 320};
tbGrid.Padding = [28 12 28 12];
tbGrid.ColumnSpacing = 12;

tbLeft = uigridlayout(tbGrid, [2 1]);
tbLeft.Layout.Row = 1; tbLeft.Layout.Column = 1;
tbLeft.RowHeight = {26, 18};
tbLeft.Padding = [0 0 0 0]; tbLeft.RowSpacing = 0;

pageTitleLabel = uilabel(tbLeft, 'Text', 'Screen Patient', 'FontWeight', 'bold', ...
    'FontSize', theme.fontSizeTitle, 'FontColor', theme.textPrimary, 'FontName', theme.fontName);
pageTitleLabel.Layout.Row = 1; pageTitleLabel.Layout.Column = 1;

breadcrumbLabel = uilabel(tbLeft, 'Text', 'Screen > Patient > Results', ...
    'FontSize', theme.fontSizeBody, 'FontColor', theme.textSecondary, 'FontName', theme.fontName);
breadcrumbLabel.Layout.Row = 2; breadcrumbLabel.Layout.Column = 1;

tbRight = uigridlayout(tbGrid, [1 3]);
tbRight.Layout.Row = 1; tbRight.Layout.Column = 2;
tbRight.ColumnWidth = {170, 40, 90};
tbRight.Padding = [0 0 0 0]; tbRight.ColumnSpacing = 12;

dateTimeLabel = uilabel(tbRight, 'Text', ...
    "Date & Time: " + string(datetime('now'), 'dd MMM yyyy, hh:mm a'), ...
    'FontSize', theme.fontSizeBody, 'FontColor', theme.textSecondary, ...
    'HorizontalAlignment', 'right', 'FontName', theme.fontName);
dateTimeLabel.Layout.Row = 1; dateTimeLabel.Layout.Column = 1;

bellLabel = uilabel(tbRight, 'Text', char(9672), 'FontSize', 16, ...
    'FontColor', theme.textSecondary, 'HorizontalAlignment', 'center');
bellLabel.Layout.Row = 1; bellLabel.Layout.Column = 2;

profileGrid = uigridlayout(tbRight, [1 2]);
profileGrid.Layout.Row = 1; profileGrid.Layout.Column = 3;
profileGrid.ColumnWidth = {28, '1x'};
profileGrid.Padding = [0 0 0 0]; profileGrid.ColumnSpacing = 4;
avatarLabel = uilabel(profileGrid, 'Text', 'OP', 'FontSize', 11, 'FontWeight', 'bold', ...
    'FontColor', theme.textPrimary, 'BackgroundColor', theme.border, ...
    'HorizontalAlignment', 'center');
avatarLabel.Layout.Row = 1; avatarLabel.Layout.Column = 1;
operatorLabel = uilabel(profileGrid, 'Text', 'Operator ' + string(char(9662)), ...
    'FontSize', theme.fontSizeBody, 'FontColor', theme.textPrimary, 'FontName', theme.fontName);
operatorLabel.Layout.Row = 1; operatorLabel.Layout.Column = 2;

% --- content area (all four pages stacked in the same cell, toggled by Visible) ---
contentHost = uipanel(mainArea, 'BackgroundColor', theme.contentBg, 'BorderType', 'none');
contentHost.Layout.Row = 2; contentHost.Layout.Column = 1;

pagePanels.Screen = makePlaceholderPage(contentHost, theme, ...
    'Screen page -- built next, once this shell is confirmed.');
pagePanels.PatientRecords = makePlaceholderPage(contentHost, theme, ...
    'Patient Records page -- placeholder.');
pagePanels.DoctorResponses = makePlaceholderPage(contentHost, theme, ...
    'Doctor Responses page -- placeholder, content TBD.');
pagePanels.Settings = makePlaceholderPage(contentHost, theme, ...
    'Settings page -- placeholder.');

setActivePage("Screen");

% =====================================================================
% nested functions
% =====================================================================
    function setActivePage(pageName)
        currentPage = pageName;

        pageNames = fieldnames(pagePanels);
        for i = 1:numel(pageNames)
            pagePanels.(pageNames{i}).Visible = strcmp(pageNames{i}, pageName);
        end

        navNames = fieldnames(navButtons);
        for i = 1:numel(navNames)
            isActive = strcmp(navNames{i}, pageName);
            btn = navButtons.(navNames{i});
            if isActive
                btn.BackgroundColor = theme.sidebarActiveBg;
                btn.FontColor = [1 1 1];
            else
                btn.BackgroundColor = theme.sidebarBg;
                btn.FontColor = theme.sidebarText;
            end
        end

        titles = struct('Screen', "Screen Patient", 'PatientRecords', "Patient Records", ...
            'DoctorResponses', "Doctor Responses", 'Settings', "Settings");
        crumbs = struct('Screen', "Screen > Patient > Results", 'PatientRecords', "Patient Records", ...
            'DoctorResponses', "Doctor Responses", 'Settings', "Settings");
        pageTitleLabel.Text = titles.(pageName);
        breadcrumbLabel.Text = crumbs.(pageName);
    end

end


%% ========================================================================
function btn = makeNavButton(parent, row, label, theme)
btn = uibutton(parent, 'Text', label, 'FontName', theme.fontName, ...
    'FontSize', theme.fontSizeBody, 'HorizontalAlignment', 'left', ...
    'BackgroundColor', theme.sidebarBg, 'FontColor', theme.sidebarText);
btn.Layout.Row = row; btn.Layout.Column = 1;
end

function panel = makePlaceholderPage(parent, theme, message)
panel = uipanel(parent, 'BackgroundColor', theme.contentBg, 'BorderType', 'none', ...
    'Position', [0 0 parent.InnerPosition(3) parent.InnerPosition(4)]);
lbl = uilabel(panel, 'Text', message, 'FontSize', theme.fontSizeSection, ...
    'FontColor', theme.textSecondary, 'FontName', theme.fontName, ...
    'HorizontalAlignment', 'center', 'Position', [40 400 700 40]);
end
