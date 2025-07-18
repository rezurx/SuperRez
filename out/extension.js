"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const sessionManager_1 = require("./sessionManager");
const securityScanner_1 = require("./securityScanner");
const projectDiscovery_1 = require("./projectDiscovery");
const costTracker_1 = require("./costTracker");
const aiOrchestrator_1 = require("./aiOrchestrator");
const crewAIIntegration_1 = require("./crewAIIntegration");
const performanceAnalyzer_1 = require("./performanceAnalyzer");
const templateEngine_1 = require("./templateEngine");
let sessionManager;
let securityScanner;
let projectDiscovery;
let costTracker;
let aiOrchestrator;
let crewAIIntegration;
let performanceAnalyzer;
let templateEngine;
let statusBarItem;
function activate(context) {
    console.log('SuperRez extension is now active!');
    // Initialize components
    sessionManager = new sessionManager_1.SessionManager(context);
    securityScanner = new securityScanner_1.SecurityScanner();
    projectDiscovery = new projectDiscovery_1.ProjectDiscovery();
    costTracker = new costTracker_1.CostTracker(context);
    aiOrchestrator = new aiOrchestrator_1.AIOrchestrator();
    crewAIIntegration = new crewAIIntegration_1.CrewAIIntegration(aiOrchestrator, costTracker);
    performanceAnalyzer = new performanceAnalyzer_1.PerformanceAnalyzer();
    templateEngine = new templateEngine_1.TemplateEngine(sessionManager, aiOrchestrator);
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'superrez.showStatus';
    statusBarItem.text = '$(zap) SuperRez';
    statusBarItem.tooltip = 'SuperRez - Cost-aware AI Assistant';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Register commands
    const commands = [
        vscode.commands.registerCommand('superrez.startSession', () => startSession()),
        vscode.commands.registerCommand('superrez.endSession', () => endSession()),
        vscode.commands.registerCommand('superrez.clearSession', () => clearSession()),
        vscode.commands.registerCommand('superrez.analyzeSecurity', () => analyzeSecurity()),
        vscode.commands.registerCommand('superrez.showStatus', () => showStatus()),
        vscode.commands.registerCommand('superrez.discoverProjects', () => discoverProjects()),
        vscode.commands.registerCommand('superrez.showAITools', () => showAITools()),
        vscode.commands.registerCommand('superrez.generatePrompt', () => generatePrompt()),
        vscode.commands.registerCommand('superrez.routeTask', () => routeTask()),
        vscode.commands.registerCommand('superrez.analyzePerformance', () => analyzePerformance()),
        vscode.commands.registerCommand('superrez.createMultiAITeam', () => createMultiAITeam()),
        vscode.commands.registerCommand('superrez.showTeamStatus', () => showTeamStatus()),
        vscode.commands.registerCommand('superrez.generateFromTemplate', () => generateFromTemplate()),
        vscode.commands.registerCommand('superrez.manageTemplates', () => manageTemplates())
    ];
    context.subscriptions.push(...commands);
    // Update status bar
    updateStatusBar();
}
exports.activate = activate;
async function startSession() {
    try {
        const projects = await projectDiscovery.findProjects();
        if (projects.length === 0) {
            vscode.window.showWarningMessage('No projects with progress files found');
            return;
        }
        const selected = await vscode.window.showQuickPick(projects.map((p, i) => ({
            label: p.name,
            description: p.progressFile,
            detail: p.path,
            project: p
        })), { placeHolder: 'Select project to start session' });
        if (selected) {
            await sessionManager.startSession(selected.project);
            vscode.window.showInformationMessage(`Started session: ${selected.project.name}`);
            updateStatusBar();
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start session: ${error}`);
    }
}
async function endSession() {
    try {
        const prompt = await sessionManager.endSession();
        if (prompt) {
            // Show prompt in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: prompt,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
            const cost = costTracker.estimateCost(prompt);
            const selection = await vscode.window.showInformationMessage(`AI prompt ready! Estimated cost: $${cost.toFixed(2)}`, 'Copy to Clipboard', 'End Session');
            if (selection === 'Copy to Clipboard') {
                vscode.env.clipboard.writeText(prompt);
            }
            if (selection === 'End Session') {
                await sessionManager.cleanup();
                statusBarItem.text = '$(zap) SuperRez';
                vscode.window.showInformationMessage('Session ended successfully!');
            }
        }
        updateStatusBar();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to end session: ${error}`);
    }
}
async function clearSession() {
    try {
        await sessionManager.cleanup();
        statusBarItem.text = '$(zap) SuperRez';
        updateStatusBar();
        vscode.window.showInformationMessage('Session cleared successfully!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to clear session: ${error}`);
    }
}
async function analyzeSecurity() {
    try {
        const activeSession = sessionManager.getActiveSession();
        if (!activeSession) {
            vscode.window.showWarningMessage('No active session. Start a session first.');
            return;
        }
        vscode.window.showInformationMessage('Running security analysis...');
        const results = await securityScanner.scan(activeSession.path);
        if (results.issues.length === 0) {
            vscode.window.showInformationMessage('✅ No security issues found');
        }
        else {
            const message = `Found ${results.issues.length} security issues`;
            vscode.window.showWarningMessage(message, 'View Details').then(selection => {
                if (selection === 'View Details') {
                    showSecurityResults(results);
                }
            });
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Security analysis failed: ${error}`);
    }
}
function showSecurityResults(results) {
    const content = `# Security Analysis Results

**Timestamp:** ${results.timestamp}
**Issues Found:** ${results.issues.length}

${results.issues.map((issue, i) => `
## ${i + 1}. ${issue.severity} - ${issue.category}

**File:** ${issue.file}:${issue.line}
**Description:** ${issue.description}

\`\`\`
${issue.code}
\`\`\`
`).join('\n')}`;
    vscode.workspace.openTextDocument({ content, language: 'markdown' })
        .then(doc => vscode.window.showTextDocument(doc));
}
function showStatus() {
    const activeSession = sessionManager.getActiveSession();
    const budget = costTracker.getBudgetStatus();
    const message = activeSession
        ? `Active: ${activeSession.name}\nBudget: $${budget.spent.toFixed(2)}/$${budget.budget.toFixed(2)}`
        : 'No active session';
    vscode.window.showInformationMessage(message);
}
async function discoverProjects() {
    try {
        const projects = await projectDiscovery.findProjects();
        const items = projects.map(p => `${p.name} (${p.progressFile})`);
        if (items.length === 0) {
            vscode.window.showInformationMessage('No projects with progress files found');
        }
        else {
            vscode.window.showQuickPick(items, {
                placeHolder: `Found ${items.length} projects`,
                canPickMany: false
            });
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to discover projects: ${error}`);
    }
}
async function showAITools() {
    try {
        const summary = await aiOrchestrator.getToolSummary();
        const doc = await vscode.workspace.openTextDocument({
            content: summary,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to show AI tools: ${error}`);
    }
}
async function generatePrompt() {
    try {
        const activeSession = sessionManager.getActiveSession();
        if (!activeSession) {
            vscode.window.showWarningMessage('No active session. Start a session first.');
            return;
        }
        // Get task type from user
        const taskType = await vscode.window.showQuickPick([
            { label: 'Analysis', description: 'Code analysis and review', value: 'analysis' },
            { label: 'Completion', description: 'Code completion and suggestions', value: 'completion' },
            { label: 'Generation', description: 'Generate new code', value: 'generation' },
            { label: 'Security', description: 'Security analysis', value: 'security' },
            { label: 'Performance', description: 'Performance optimization', value: 'performance' }
        ], { placeHolder: 'Select task type' });
        if (!taskType)
            return;
        // Get AI tool recommendation
        const route = await aiOrchestrator.getTaskRecommendation(taskType.value, 1000);
        if (route.recommendedTool === 'none') {
            vscode.window.showWarningMessage(route.rationale);
            return;
        }
        // Generate context-aware prompt
        const context = {
            projectName: activeSession.name,
            projectPath: activeSession.path,
            taskType: taskType.value,
            additionalContext: 'Generated by SuperRez AI Orchestrator'
        };
        const prompt = await aiOrchestrator.generatePrompt(taskType.value, context, route.recommendedTool);
        // Show prompt in new document
        const doc = await vscode.workspace.openTextDocument({
            content: `# SuperRez Smart Prompt

**Recommended Tool**: ${route.recommendedTool}
**Task Type**: ${taskType.label}
**Rationale**: ${route.rationale}

${route.alternatives.length > 0 ? `**Alternatives**: ${route.alternatives.join(', ')}\n\n` : ''}

---

${prompt}`,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Smart prompt generated for ${route.recommendedTool}`, 'Copy to Clipboard').then(selection => {
            if (selection === 'Copy to Clipboard') {
                vscode.env.clipboard.writeText(prompt);
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to generate prompt: ${error}`);
    }
}
async function routeTask() {
    try {
        const availableTools = await aiOrchestrator.detectAvailableTools();
        if (availableTools.length === 0) {
            vscode.window.showWarningMessage('No AI tools detected. Please install Claude Code, Gemini CLI, or Ollama.');
            return;
        }
        const taskType = await vscode.window.showQuickPick([
            { label: 'Analysis', value: 'analysis' },
            { label: 'Completion', value: 'completion' },
            { label: 'Generation', value: 'generation' },
            { label: 'Security', value: 'security' },
            { label: 'Performance', value: 'performance' }
        ], { placeHolder: 'Select task type' });
        if (!taskType)
            return;
        const route = await aiOrchestrator.getTaskRecommendation(taskType.value);
        const message = `**Recommended**: ${route.recommendedTool}
**Rationale**: ${route.rationale}
${route.alternatives.length > 0 ? `**Alternatives**: ${route.alternatives.join(', ')}` : ''}`;
        vscode.window.showInformationMessage(message, 'Generate Prompt', 'View AI Tools').then(selection => {
            if (selection === 'Generate Prompt') {
                generatePrompt();
            }
            else if (selection === 'View AI Tools') {
                showAITools();
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to route task: ${error}`);
    }
}
async function analyzePerformance() {
    try {
        const activeSession = sessionManager.getActiveSession();
        if (!activeSession) {
            vscode.window.showWarningMessage('No active session. Start a session first.');
            return;
        }
        vscode.window.showInformationMessage('Running performance analysis...');
        const results = await performanceAnalyzer.analyze(activeSession.path);
        if (results.issues.length === 0) {
            vscode.window.showInformationMessage('✅ No performance issues found');
        }
        else {
            const report = performanceAnalyzer.generateReport(results);
            const doc = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
            const highIssues = results.issues.filter(i => i.severity === 'HIGH').length;
            const message = `Found ${results.issues.length} performance issues (${highIssues} high priority)`;
            vscode.window.showWarningMessage(message, 'View Report').then(selection => {
                if (selection === 'View Report') {
                    vscode.window.showTextDocument(doc);
                }
            });
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Performance analysis failed: ${error}`);
    }
}
function updateStatusBar() {
    const activeSession = sessionManager.getActiveSession();
    if (activeSession) {
        statusBarItem.text = `$(zap) SuperRez: ${activeSession.name}`;
        statusBarItem.tooltip = `Active session: ${activeSession.name}`;
    }
    else {
        statusBarItem.text = '$(zap) SuperRez';
        statusBarItem.tooltip = 'SuperRez - No active session';
    }
}
async function createMultiAITeam() {
    try {
        const activeSession = sessionManager.getActiveSession();
        if (!activeSession) {
            vscode.window.showWarningMessage('No active session. Start a session first.');
            return;
        }
        // Get task description from user
        const taskDescription = await vscode.window.showInputBox({
            prompt: 'Describe the task for the Multi-AI team',
            placeHolder: 'e.g., Add user authentication system with security best practices'
        });
        if (!taskDescription) {
            return;
        }
        vscode.window.showInformationMessage('🤖 Assembling Multi-AI specialist team...');
        const result = await crewAIIntegration.createMultiAgentTeam(activeSession, taskDescription);
        // Show results
        const outputChannel = vscode.window.createOutputChannel('SuperRez Multi-AI Team');
        outputChannel.clear();
        outputChannel.appendLine('# Multi-AI Team Collaboration Results\n');
        outputChannel.appendLine(`**Task**: ${taskDescription}`);
        outputChannel.appendLine(`**Project**: ${activeSession.name}`);
        outputChannel.appendLine(`**Execution Time**: ${(result.usageMetrics.executionTime / 1000).toFixed(1)}s`);
        outputChannel.appendLine(`**Total Cost**: $${result.usageMetrics.totalCost.toFixed(3)}\n`);
        if (result.consensus) {
            outputChannel.appendLine(`## Consensus Results`);
            outputChannel.appendLine(`- **Agreements**: ${result.consensus.agreements}`);
            outputChannel.appendLine(`- **Disagreements**: ${result.consensus.disagreements}`);
            outputChannel.appendLine(`- **Final Decision**: ${result.consensus.finalDecision}\n`);
        }
        outputChannel.appendLine('## Team Recommendations\n');
        outputChannel.appendLine(result.result);
        outputChannel.show();
        vscode.window.showInformationMessage(`🎉 Multi-AI team analysis complete! Cost: $${result.usageMetrics.totalCost.toFixed(3)}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Multi-AI team creation failed: ${error}`);
    }
}
async function showTeamStatus() {
    try {
        const status = await crewAIIntegration.getTeamStatus();
        const outputChannel = vscode.window.createOutputChannel('SuperRez Team Status');
        outputChannel.clear();
        outputChannel.appendLine(status);
        outputChannel.show();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to get team status: ${error}`);
    }
}
async function generateFromTemplate() {
    try {
        const templates = templateEngine.getAvailableTemplates();
        if (templates.length === 0) {
            vscode.window.showWarningMessage('No templates available');
            return;
        }
        const selectedTemplate = await vscode.window.showQuickPick(templates.map(t => ({
            label: t.name,
            description: t.description,
            detail: `${t.category} | ${t.language} ${t.framework ? `(${t.framework})` : ''}`,
            template: t
        })), { placeHolder: 'Select a template to generate code from' });
        if (selectedTemplate) {
            // Collect template variables
            const customVariables = {};
            for (const variable of selectedTemplate.template.variables) {
                if (variable.required || variable.defaultValue === undefined) {
                    const value = await vscode.window.showInputBox({
                        prompt: variable.description,
                        placeHolder: variable.defaultValue?.toString() || '',
                        value: variable.defaultValue?.toString() || ''
                    });
                    if (value === undefined)
                        return; // User cancelled
                    // Type conversion
                    switch (variable.type) {
                        case 'boolean':
                            customVariables[variable.name] = value.toLowerCase() === 'true';
                            break;
                        case 'array':
                            customVariables[variable.name] = value.split(',').map(s => s.trim());
                            break;
                        default:
                            customVariables[variable.name] = value;
                    }
                }
            }
            const generatedCode = await templateEngine.generateFromTemplate(selectedTemplate.template.name, customVariables);
            if (generatedCode) {
                // Create new document with generated code
                const doc = await vscode.workspace.openTextDocument({
                    content: generatedCode,
                    language: selectedTemplate.template.language
                });
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage(`Generated code from template: ${selectedTemplate.template.name}`);
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to generate from template: ${error}`);
    }
}
async function manageTemplates() {
    try {
        const templates = templateEngine.getAvailableTemplates();
        const categories = [...new Set(templates.map(t => t.category))];
        const action = await vscode.window.showQuickPick([
            { label: 'View All Templates', action: 'view-all' },
            { label: 'View by Category', action: 'view-category' },
            { label: 'Template Statistics', action: 'stats' }
        ], { placeHolder: 'Choose template management action' });
        if (!action)
            return;
        const outputChannel = vscode.window.createOutputChannel('SuperRez Templates');
        outputChannel.clear();
        switch (action.action) {
            case 'view-all':
                outputChannel.appendLine('# Available Templates\n');
                templates.forEach(template => {
                    outputChannel.appendLine(`## ${template.name}`);
                    outputChannel.appendLine(`**Description**: ${template.description}`);
                    outputChannel.appendLine(`**Category**: ${template.category}`);
                    outputChannel.appendLine(`**Language**: ${template.language}`);
                    if (template.framework) {
                        outputChannel.appendLine(`**Framework**: ${template.framework}`);
                    }
                    outputChannel.appendLine(`**Variables**: ${template.variables.length}`);
                    outputChannel.appendLine('');
                });
                break;
            case 'view-category':
                const selectedCategory = await vscode.window.showQuickPick(categories.map(cat => ({ label: cat, category: cat })), { placeHolder: 'Select category to view' });
                if (selectedCategory) {
                    const categoryTemplates = templateEngine.getTemplatesByCategory(selectedCategory.category);
                    outputChannel.appendLine(`# ${selectedCategory.category.toUpperCase()} Templates\n`);
                    categoryTemplates.forEach(template => {
                        outputChannel.appendLine(`- **${template.name}**: ${template.description}`);
                    });
                }
                break;
            case 'stats':
                outputChannel.appendLine('# Template Statistics\n');
                outputChannel.appendLine(`**Total Templates**: ${templates.length}`);
                outputChannel.appendLine(`**Categories**: ${categories.length}`);
                outputChannel.appendLine('');
                outputChannel.appendLine('## By Category:');
                categories.forEach(category => {
                    const count = templates.filter(t => t.category === category).length;
                    outputChannel.appendLine(`- ${category}: ${count}`);
                });
                outputChannel.appendLine('');
                outputChannel.appendLine('## By Language:');
                const languages = [...new Set(templates.map(t => t.language))];
                languages.forEach(language => {
                    const count = templates.filter(t => t.language === language).length;
                    outputChannel.appendLine(`- ${language}: ${count}`);
                });
                break;
        }
        outputChannel.show();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to manage templates: ${error}`);
    }
}
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map