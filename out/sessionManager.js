"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SessionManager {
    constructor(context) {
        this.context = context;
        this.activeSession = null;
        this.sessionFile = path.join(context.globalStorageUri.fsPath, 'superrez-session.json');
        this.loadSession();
    }
    async startSession(project) {
        this.activeSession = {
            name: project.name,
            path: project.path,
            startTime: new Date(),
            progressFile: project.progressFile
        };
        await this.saveSession();
        // Change VSCode workspace to project directory
        const uri = vscode.Uri.file(project.path);
        await vscode.commands.executeCommand('vscode.openFolder', uri, false);
    }
    async endSession() {
        if (!this.activeSession) {
            throw new Error('No active session');
        }
        const context = await this.gatherContext();
        const prompt = this.generatePrompt(context);
        // Don't clear session yet - user might want to continue
        return prompt;
    }
    getActiveSession() {
        return this.activeSession;
    }
    async cleanup() {
        this.activeSession = null;
        await this.saveSession();
    }
    async gatherContext() {
        if (!this.activeSession) {
            throw new Error('No active session');
        }
        const projectPath = this.activeSession.path;
        const context = {
            projectName: this.activeSession.name,
            projectPath: projectPath,
            sessionDate: new Date().toISOString(),
            gitStatus: '',
            progressContent: '',
            fileStructure: ''
        };
        try {
            // Check if it's a git repo
            const { stdout: gitCheck } = await execAsync('git rev-parse --git-dir', { cwd: projectPath });
            if (gitCheck) {
                // Get git status
                const { stdout: status } = await execAsync('git status --porcelain', { cwd: projectPath });
                context.gitStatus = status;
                // Get recent commits
                const { stdout: commits } = await execAsync('git log --oneline -3', { cwd: projectPath });
                context.recentCommits = commits;
                // Get changed files
                const { stdout: changedFiles } = await execAsync('git diff --name-only HEAD', { cwd: projectPath });
                context.changedFiles = changedFiles;
            }
        }
        catch (error) {
            // Not a git repo or git error - continue without git info
        }
        try {
            // Read progress file
            const progressPath = path.join(projectPath, this.activeSession.progressFile);
            if (fs.existsSync(progressPath)) {
                context.progressContent = fs.readFileSync(progressPath, 'utf8');
            }
        }
        catch (error) {
            // Progress file not found - continue
        }
        try {
            // Get file structure (recent files)
            const { stdout: files } = await execAsync(`find . -maxdepth 2 -type f -not -path "*/.*" -not -path "*/node_modules/*" | head -10`, { cwd: projectPath });
            context.fileStructure = files;
        }
        catch (error) {
            // File listing failed - continue
        }
        return context;
    }
    generatePrompt(context) {
        return `Based on the project context below, please update the progress.md file for this development session.

**Instructions:**
- Analyze the git changes and file modifications to understand what was accomplished
- Update the progress.md with specific achievements, not generic statements
- Include any new issues discovered or resolved
- Add concrete next steps based on the current state
- Maintain the existing progress.md format and style
- Focus on actionable, specific updates

**Cost Estimate:** ~$0.10-0.20 (depending on AI tool)

# Project Context for AI Update

## Project: ${context.projectName}
**Path:** ${context.projectPath}
**Session Date:** ${context.sessionDate}

## Git Status
\`\`\`
${context.gitStatus || 'No git changes'}
\`\`\`

## Recent Commits (last 3)
\`\`\`
${context.recentCommits || 'No recent commits'}
\`\`\`

## Changed Files Since Last Commit
\`\`\`
${context.changedFiles || 'No changed files'}
\`\`\`

## Current Progress File
\`\`\`markdown
${context.progressContent || 'No progress file found'}
\`\`\`

## File Structure (Recent)
\`\`\`
${context.fileStructure || 'No file structure available'}
\`\`\`

---

**Task:** Please provide an updated progress.md file that reflects the work completed in this session.`;
    }
    async saveSession() {
        const sessionData = {
            activeSession: this.activeSession
        };
        try {
            // Ensure directory exists
            const dir = path.dirname(this.sessionFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.sessionFile, JSON.stringify(sessionData, null, 2));
        }
        catch (error) {
            console.error('Failed to save session:', error);
        }
    }
    loadSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const data = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                this.activeSession = data.activeSession;
            }
        }
        catch (error) {
            console.error('Failed to load session:', error);
            this.activeSession = null;
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=sessionManager.js.map