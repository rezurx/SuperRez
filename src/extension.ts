import * as vscode from 'vscode';
import { SessionManager } from './sessionManager';
import { SecurityScanner } from './securityScanner';
import { ProjectDiscovery } from './projectDiscovery';
import { CostTracker } from './costTracker';
import { AIOrchestrator } from './aiOrchestrator';
import { PerformanceAnalyzer } from './performanceAnalyzer';

let sessionManager: SessionManager;
let securityScanner: SecurityScanner;
let projectDiscovery: ProjectDiscovery;
let costTracker: CostTracker;
let aiOrchestrator: AIOrchestrator;
let performanceAnalyzer: PerformanceAnalyzer;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('SuperRez extension is now active!');

    // Initialize components
    sessionManager = new SessionManager(context);
    securityScanner = new SecurityScanner();
    projectDiscovery = new ProjectDiscovery();
    costTracker = new CostTracker(context);
    aiOrchestrator = new AIOrchestrator();
    performanceAnalyzer = new PerformanceAnalyzer();

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
        vscode.commands.registerCommand('superrez.analyzeSecurity', () => analyzeSecurity()),
        vscode.commands.registerCommand('superrez.showStatus', () => showStatus()),
        vscode.commands.registerCommand('superrez.discoverProjects', () => discoverProjects()),
        vscode.commands.registerCommand('superrez.showAITools', () => showAITools()),
        vscode.commands.registerCommand('superrez.generatePrompt', () => generatePrompt()),
        vscode.commands.registerCommand('superrez.routeTask', () => routeTask()),
        vscode.commands.registerCommand('superrez.analyzePerformance', () => analyzePerformance())
    ];

    context.subscriptions.push(...commands);

    // Update status bar
    updateStatusBar();
}

async function startSession() {
    try {
        const projects = await projectDiscovery.findProjects();
        if (projects.length === 0) {
            vscode.window.showWarningMessage('No projects with progress files found');
            return;
        }

        const selected = await vscode.window.showQuickPick(
            projects.map((p, i) => ({
                label: p.name,
                description: p.progressFile,
                detail: p.path,
                project: p
            })),
            { placeHolder: 'Select project to start session' }
        );

        if (selected) {
            await sessionManager.startSession(selected.project);
            vscode.window.showInformationMessage(`Started session: ${selected.project.name}`);
            updateStatusBar();
        }
    } catch (error) {
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
            vscode.window.showInformationMessage(
                `AI prompt ready! Estimated cost: $${cost.toFixed(2)}`,
                'Copy to Clipboard'
            ).then(selection => {
                if (selection === 'Copy to Clipboard') {
                    vscode.env.clipboard.writeText(prompt);
                }
            });
        }
        updateStatusBar();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to end session: ${error}`);
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
        } else {
            const message = `Found ${results.issues.length} security issues`;
            vscode.window.showWarningMessage(message, 'View Details').then(selection => {
                if (selection === 'View Details') {
                    showSecurityResults(results);
                }
            });
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Security analysis failed: ${error}`);
    }
}

function showSecurityResults(results: any) {
    const content = `# Security Analysis Results

**Timestamp:** ${results.timestamp}
**Issues Found:** ${results.issues.length}

${results.issues.map((issue: any, i: number) => `
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
        } else {
            vscode.window.showQuickPick(items, { 
                placeHolder: `Found ${items.length} projects`,
                canPickMany: false 
            });
        }
    } catch (error) {
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
    } catch (error) {
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

        if (!taskType) return;

        // Get AI tool recommendation
        const route = await aiOrchestrator.getTaskRecommendation(taskType.value as any, 1000);
        
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
        
        vscode.window.showInformationMessage(
            `Smart prompt generated for ${route.recommendedTool}`,
            'Copy to Clipboard'
        ).then(selection => {
            if (selection === 'Copy to Clipboard') {
                vscode.env.clipboard.writeText(prompt);
            }
        });

    } catch (error) {
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

        if (!taskType) return;

        const route = await aiOrchestrator.getTaskRecommendation(taskType.value as any);
        
        const message = `**Recommended**: ${route.recommendedTool}
**Rationale**: ${route.rationale}
${route.alternatives.length > 0 ? `**Alternatives**: ${route.alternatives.join(', ')}` : ''}`;

        vscode.window.showInformationMessage(message, 'Generate Prompt', 'View AI Tools').then(selection => {
            if (selection === 'Generate Prompt') {
                generatePrompt();
            } else if (selection === 'View AI Tools') {
                showAITools();
            }
        });

    } catch (error) {
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
        } else {
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
    } catch (error) {
        vscode.window.showErrorMessage(`Performance analysis failed: ${error}`);
    }
}

function updateStatusBar() {
    const activeSession = sessionManager.getActiveSession();
    if (activeSession) {
        statusBarItem.text = `$(zap) SuperRez: ${activeSession.name}`;
        statusBarItem.tooltip = `Active session: ${activeSession.name}`;
    } else {
        statusBarItem.text = '$(zap) SuperRez';
        statusBarItem.tooltip = 'SuperRez - No active session';
    }
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}