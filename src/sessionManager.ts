import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Project {
    name: string;
    path: string;
    progressFile: string;
}

export interface SessionData {
    projectName: string;
    projectPath: string;
    startTime: Date;
    lastActivity: Date;
    projectType: string;
    contextFiles: string[];
    metadata: Record<string, any>;
}

export class SessionManager {
    private currentSession: SessionData | null = null;
    private readonly sessionFile: string;

    constructor(private context: vscode.ExtensionContext) {
        this.sessionFile = path.join(context.globalStorageUri.fsPath, 'superrez-session.json');
        this.loadSession();
        this.initializeAutoSession();
    }

    // Auto-initialize session when VSCode opens a workspace
    private async initializeAutoSession(): Promise<void> {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            await this.startSession(workspaceFolder.uri.fsPath);
        }
    }

    async startSession(projectPath: string): Promise<SessionData> {
        const projectName = path.basename(projectPath);
        const projectType = await this.detectProjectType(projectPath);
        const contextFiles = await this.gatherContextFiles(projectPath);

        this.currentSession = {
            projectName,
            projectPath,
            startTime: new Date(),
            lastActivity: new Date(),
            projectType,
            contextFiles,
            metadata: {}
        };

        // Save session to file
        await this.saveSession();
        
        // Show status notification
        vscode.window.showInformationMessage(
            `🚀 SuperRez session started: ${projectName} (${projectType})`
        );
        
        return this.currentSession;
    }

    async getCurrentSession(): Promise<SessionData | null> {
        if (!this.currentSession) {
            // Try to load from file
            await this.loadSession();
        }
        return this.currentSession;
    }

    async getCurrentContext(): Promise<string | null> {
        if (!this.currentSession) return null;

        const context = [];
        
        // Add project information
        context.push(`Project: ${this.currentSession.projectName}`);
        context.push(`Type: ${this.currentSession.projectType}`);
        context.push(`Path: ${this.currentSession.projectPath}`);
        
        // Add relevant file contents
        for (const file of this.currentSession.contextFiles.slice(0, 3)) { // Limit to first 3 files
            try {
                const fullPath = path.join(this.currentSession.projectPath, file);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    // Limit file content to prevent context overflow
                    const truncatedContent = content.length > 1000 
                        ? content.substring(0, 1000) + '...[truncated]'
                        : content;
                    context.push(`\n--- ${file} ---\n${truncatedContent}`);
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }

        return context.join('\n');
    }

    async endSession(): Promise<void> {
        if (this.currentSession) {
            vscode.window.showInformationMessage(
                `📝 Session ended: ${this.currentSession.projectName}`
            );
            
            // Remove session file
            try {
                if (fs.existsSync(this.sessionFile)) {
                    fs.unlinkSync(this.sessionFile);
                }
            } catch (error) {
                // Ignore errors when removing session file
            }
            
            this.currentSession = null;
        }
    }

    // Legacy method for backwards compatibility
    async startSessionLegacy(project: Project): Promise<void> {
        await this.startSession(project.path);
    }

    // Legacy method for backwards compatibility  
    async gatherContext(): Promise<any> {
        if (!this.currentSession) {
            throw new Error('No active session');
        }

        const projectPath = this.currentSession.projectPath;
        const context: any = {
            projectName: this.currentSession.projectName,
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
        } catch (error) {
            // Not a git repo or git error - continue without git info
        }

        try {
            // Read progress file if it exists
            const progressFiles = ['progress_tracker.md', 'claude_project_docs.md', 'README.md'];
            for (const progressFile of progressFiles) {
                const progressPath = path.join(projectPath, progressFile);
                if (fs.existsSync(progressPath)) {
                    context.progressContent = fs.readFileSync(progressPath, 'utf8');
                    break;
                }
            }
        } catch (error) {
            // Progress file not found - continue
        }

        try {
            // Get file structure (recent files)
            const { stdout: files } = await execAsync(
                `find . -maxdepth 2 -type f -not -path "*/.*" -not -path "*/node_modules/*" | head -10`,
                { cwd: projectPath }
            );
            context.fileStructure = files;
        } catch (error) {
            // File listing failed - continue
        }

        return context;
    }

    // Legacy method for backwards compatibility
    getActiveSession(): SessionData | null {
        return this.currentSession;
    }

    // Legacy method for backwards compatibility
    async cleanup(): Promise<void> {
        await this.endSession();
    }

    private async detectProjectType(projectPath: string): Promise<string> {
        const indicators = [
            { file: 'package.json', type: 'Node.js/JavaScript' },
            { file: 'requirements.txt', type: 'Python' },
            { file: 'pyproject.toml', type: 'Python (Modern)' },
            { file: 'Cargo.toml', type: 'Rust' },
            { file: 'go.mod', type: 'Go' },
            { file: 'pom.xml', type: 'Java/Maven' },
            { file: 'build.gradle', type: 'Java/Gradle' },
            { file: 'hardhat.config.js', type: 'Blockchain/Hardhat' },
            { file: 'truffle-config.js', type: 'Blockchain/Truffle' },
            { file: 'Dockerfile', type: 'Docker Project' },
            { file: '.git', type: 'Git Repository' },
            // User-specific files
            { file: 'progress_tracker.md', type: 'SuperRez Project' },
            { file: 'claude_project_docs.md', type: 'Claude Project' },
            { file: 'final_progress_tracker.md', type: 'Completed Project' },
            { file: 'memecoin_sniper.py', type: 'Memecoin Bot' },
            { file: 'main_memecoin_sniper.py', type: 'Memecoin Sniper' },
            { file: 'bot.py', type: 'Python Bot' },
            { file: 'trading_bot.py', type: 'Trading Bot' }
        ];

        for (const indicator of indicators) {
            const fullPath = path.join(projectPath, indicator.file);
            if (fs.existsSync(fullPath)) {
                return indicator.type;
            }
        }

        // Check for common file extensions
        try {
            const files = fs.readdirSync(projectPath);
            if (files.some(f => f.endsWith('.py'))) return 'Python Script';
            if (files.some(f => f.endsWith('.js') || f.endsWith('.ts'))) return 'JavaScript/TypeScript';
            if (files.some(f => f.endsWith('.sol'))) return 'Solidity/Blockchain';
            if (files.some(f => f.endsWith('.rs'))) return 'Rust';
            if (files.some(f => f.endsWith('.go'))) return 'Go';
            if (files.some(f => f.endsWith('.java'))) return 'Java';
        } catch (error) {
            // Ignore errors reading directory
        }

        return 'Unknown';
    }

    private async gatherContextFiles(projectPath: string): Promise<string[]> {
        const contextFiles: string[] = [];
        
        // Important files to include in context
        const importantFiles = [
            'README.md',
            'readme.md',
            'README.txt',
            'package.json',
            'requirements.txt',
            'pyproject.toml',
            'main.py',
            'index.js',
            'app.py',
            'main_memecoin_sniper.py',
            'memecoin_sniper.py',
            'bot.py',
            'trading_bot.py',
            'progress_tracker.md',
            'claude_project_docs.md',
            'final_progress_tracker.md',
            '.env.example',
            'config.py',
            'settings.py',
            'tsconfig.json',
            'Cargo.toml',
            'go.mod',
            'pom.xml'
        ];

        for (const file of importantFiles) {
            const fullPath = path.join(projectPath, file);
            if (fs.existsSync(fullPath)) {
                contextFiles.push(file);
            }
        }

        // Look for recent source files (last 5)
        try {
            const files = fs.readdirSync(projectPath);
            const recentFiles = files
                .filter(f => f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.rs') || f.endsWith('.go'))
                .filter(f => !importantFiles.includes(f))
                .slice(0, 5);
            
            contextFiles.push(...recentFiles);
        } catch (error) {
            // Ignore errors reading directory
        }

        return contextFiles;
    }

    private async saveSession(): Promise<void> {
        if (this.currentSession) {
            try {
                // Ensure directory exists
                const dir = path.dirname(this.sessionFile);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(this.sessionFile, JSON.stringify(this.currentSession, null, 2));
            } catch (error) {
                // Ignore errors saving session
                console.error('Failed to save session:', error);
            }
        }
    }

    private async loadSession(): Promise<void> {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const data = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                this.currentSession = {
                    ...data,
                    startTime: new Date(data.startTime),
                    lastActivity: new Date(data.lastActivity)
                };
            }
        } catch (error) {
            // Ignore errors loading session
            this.currentSession = null;
            console.error('Failed to load session:', error);
        }
    }

    // Generate context-aware prompt for AI requests
    generatePrompt(context: any): string {
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

    // Get session status for display
    getSessionStatus(): { 
        active: boolean; 
        projectName?: string; 
        projectType?: string; 
        duration?: string;
        contextFiles?: number;
    } {
        if (!this.currentSession) {
            return { active: false };
        }

        const duration = Math.floor((Date.now() - this.currentSession.startTime.getTime()) / (1000 * 60));
        
        return {
            active: true,
            projectName: this.currentSession.projectName,
            projectType: this.currentSession.projectType,
            duration: `${duration}m`,
            contextFiles: this.currentSession.contextFiles.length
        };
    }

    // Update last activity timestamp
    updateActivity(): void {
        if (this.currentSession) {
            this.currentSession.lastActivity = new Date();
            this.saveSession();
        }
    }
}