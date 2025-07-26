import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface CostEntry {
    timestamp: Date;
    amount: number;
    description: string;
    aiTool: string;
    tokens?: number;
}

export interface BudgetConfig {
    monthlyBudget: number;
    currentMonth: string;
    totalSpent: number;
    entries: CostEntry[];
}

export interface BudgetStatus {
    budget: number;
    spent: number;
    remaining: number;
    currentMonth: string;
    percentage: number;
    entries: CostEntry[];
}

export class CostTracker {
    private configPath: string;
    private budget: BudgetConfig;
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext) {
        this.configPath = path.join(os.homedir(), '.superrez', 'extension-budget.json');
        this.budget = this.getDefaultBudget();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.loadBudget();
        this.updateStatusBar();
        this.statusBarItem.show();
    }

    private getDefaultBudget(): BudgetConfig {
        return {
            monthlyBudget: 50.0,
            currentMonth: this.getCurrentMonth(),
            totalSpent: 0,
            entries: []
        };
    }

    private getCurrentMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    estimateCost(prompt: string, aiTool: string = 'claude'): number {
        const tokens = this.estimateTokens(prompt);
        
        const pricing = {
            'claude': { input: 0.003, output: 0.015 }, // per 1K tokens
            'gpt-4': { input: 0.030, output: 0.060 },
            'gpt-3.5': { input: 0.0015, output: 0.002 },
            'gemini': { input: 0.00025, output: 0.0005 },
            'moonshot': { input: 0.0015, output: 0.0015 },
            'kimi-k2': { input: 0.015, output: 0.015 },
            'ollama': { input: 0, output: 0 }, // Free local
            'mock': { input: 0, output: 0 } // Free mock responses
        };

        const tool = pricing[aiTool as keyof typeof pricing] || pricing['claude'];
        const inputCost = (tokens / 1000) * tool.input;
        const outputCost = (tokens / 1000) * tool.output; // Assume similar output length
        
        return inputCost + outputCost;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    async recordCost(amount: number, description: string, aiTool: string, tokens?: number): Promise<void> {
        await this.resetIfNewMonth();
        
        const entry: CostEntry = {
            timestamp: new Date(),
            amount,
            description,
            aiTool,
            tokens
        };

        this.budget.entries.push(entry);
        this.budget.totalSpent += amount;
        
        await this.saveBudget();
        this.updateStatusBar();

        // Show warning if approaching budget limit
        if (this.shouldWarnBudget()) {
            const remaining = this.getRemainingBudget();
            vscode.window.showWarningMessage(
                `⚠️ SuperRez Budget Warning: Only $${remaining.toFixed(2)} remaining this month!`,
                'View Details'
            ).then((choice) => {
                if (choice === 'View Details') {
                    this.showBudgetReport();
                }
            });
        }
    }

    getBudgetStatus(): BudgetStatus {
        const remaining = this.getRemainingBudget();
        const percentage = (this.budget.totalSpent / this.budget.monthlyBudget) * 100;
        
        return {
            budget: this.budget.monthlyBudget,
            spent: this.budget.totalSpent,
            remaining,
            currentMonth: this.budget.currentMonth,
            percentage,
            entries: [...this.budget.entries].reverse() // Most recent first
        };
    }

    getRemainingBudget(): number {
        return Math.max(0, this.budget.monthlyBudget - this.budget.totalSpent);
    }

    getTotalSpent(): number {
        return this.budget.totalSpent;
    }

    getMonthlyBudget(): number {
        return this.budget.monthlyBudget;
    }

    async setMonthlyBudget(amount: number): Promise<void> {
        this.budget.monthlyBudget = amount;
        await this.saveBudget();
        this.updateStatusBar();
        
        vscode.window.showInformationMessage(
            `💰 SuperRez: Monthly budget updated to $${amount.toFixed(2)}`
        );
    }

    async checkBudget(estimatedCost: number): Promise<boolean> {
        await this.resetIfNewMonth();
        
        const config = vscode.workspace.getConfiguration('superrez');
        const showWarnings = config.get<boolean>('showCostWarnings', true);
        
        if (!showWarnings) {
            return true;
        }

        const newTotal = this.budget.totalSpent + estimatedCost;
        
        if (newTotal > this.budget.monthlyBudget) {
            const choice = await vscode.window.showWarningMessage(
                `This operation would exceed your monthly budget!\n` +
                `Current: $${this.budget.totalSpent.toFixed(2)} + $${estimatedCost.toFixed(2)} = $${newTotal.toFixed(2)}\n` +
                `Budget: $${this.budget.monthlyBudget.toFixed(2)}`,
                'Proceed Anyway',
                'Cancel'
            );
            
            return choice === 'Proceed Anyway';
        }

        if (newTotal > this.budget.monthlyBudget * 0.8) {
            const choice = await vscode.window.showWarningMessage(
                `You're approaching your monthly budget limit!\n` +
                `Current: $${this.budget.totalSpent.toFixed(2)} + $${estimatedCost.toFixed(2)} = $${newTotal.toFixed(2)}\n` +
                `Budget: $${this.budget.monthlyBudget.toFixed(2)}`,
                'Proceed',
                'Cancel'
            );
            
            return choice === 'Proceed';
        }

        return true;
    }

    getMonthlyReport(): string {
        const status = this.getBudgetStatus();
        const breakdown = this.getCostBreakdown();
        
        let report = `# 💰 SuperRez Monthly Cost Report (${status.currentMonth})\n\n`;
        report += `**Total Budget:** $${status.budget.toFixed(2)}\n`;
        report += `**Spent:** $${status.spent.toFixed(2)}\n`;
        report += `**Remaining:** $${status.remaining.toFixed(2)}\n`;
        report += `**Usage:** ${status.percentage.toFixed(1)}%\n\n`;
        
        if (Object.keys(breakdown).length > 0) {
            report += `## 📊 Cost Breakdown by AI Tool\n`;
            for (const [tool, data] of Object.entries(breakdown)) {
                report += `- **${tool}:** $${data.total.toFixed(3)} (${data.count} calls, avg: $${data.average.toFixed(3)})\n`;
            }
            report += '\n';
        }
        
        if (status.entries.length > 0) {
            report += `## 📋 Recent Transactions (last 10)\n`;
            status.entries.slice(0, 10).forEach((entry, index) => {
                const date = entry.timestamp.toLocaleDateString();
                const time = entry.timestamp.toLocaleTimeString();
                report += `${index + 1}. $${entry.amount.toFixed(3)} - ${entry.description} (${entry.aiTool}) - ${date} ${time}\n`;
            });
            report += '\n';
        }
        
        report += `## 💡 Cost-Saving Tips\n`;
        report += `- Use local security analysis (FREE)\n`;
        report += `- Prefer shorter prompts when possible\n`;
        report += `- Use free tools like Ollama for routine tasks\n`;
        report += `- Batch similar requests together\n`;
        report += `- Use mock mode for testing and development\n`;
        
        return report;
    }

    // Get cost breakdown by AI tool
    getCostBreakdown(): Record<string, { total: number; count: number; average: number }> {
        const breakdown: Record<string, { total: number; count: number; average: number }> = {};
        
        for (const entry of this.budget.entries) {
            if (!breakdown[entry.aiTool]) {
                breakdown[entry.aiTool] = { total: 0, count: 0, average: 0 };
            }
            
            breakdown[entry.aiTool].total += entry.amount;
            breakdown[entry.aiTool].count += 1;
        }
        
        // Calculate averages
        for (const tool in breakdown) {
            breakdown[tool].average = breakdown[tool].total / breakdown[tool].count;
        }
        
        return breakdown;
    }

    private async loadBudget(): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            if (fs.existsSync(this.configPath)) {
                const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.budget = {
                    ...data,
                    entries: data.entries.map((entry: any) => ({
                        ...entry,
                        timestamp: new Date(entry.timestamp)
                    }))
                };
                
                // Check if we need to reset for new month
                await this.resetIfNewMonth();
            } else {
                // Create default budget file
                await this.saveBudget();
            }
        } catch (error) {
            // Use default budget if loading fails
            this.budget = this.getDefaultBudget();
            console.error('Error loading budget data:', error);
        }
    }

    private async resetIfNewMonth(): Promise<void> {
        const currentMonth = this.getCurrentMonth();
        
        if (this.budget.currentMonth !== currentMonth) {
            // Archive previous month's data
            await this.archiveMonth(this.budget.currentMonth);
            
            // Reset for new month
            this.budget = {
                monthlyBudget: this.budget.monthlyBudget, // Keep same budget
                currentMonth,
                totalSpent: 0,
                entries: []
            };
            
            await this.saveBudget();
            this.updateStatusBar();
            
            // Show notification about new month reset
            vscode.window.showInformationMessage(
                `💰 SuperRez: New month budget reset! $${this.budget.monthlyBudget.toFixed(2)} available.`
            );
        }
    }

    private async archiveMonth(month: string): Promise<void> {
        try {
            const archivePath = path.join(os.homedir(), '.superrez', 'archive');
            if (!fs.existsSync(archivePath)) {
                fs.mkdirSync(archivePath, { recursive: true });
            }
            
            const archiveFile = path.join(archivePath, `extension-budget-${month}.json`);
            fs.writeFileSync(archiveFile, JSON.stringify(this.budget, null, 2));
        } catch (error) {
            // Ignore archive errors
        }
    }

    private async saveBudget(): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(this.budget, null, 2));
        } catch (error) {
            console.error('Error saving budget data:', error);
        }
    }

    private updateStatusBar(): void {
        const remaining = this.getRemainingBudget();
        const percentage = (this.budget.totalSpent / this.budget.monthlyBudget) * 100;
        
        let icon = '💰';
        
        if (percentage >= 95) {
            icon = '🚨';
        } else if (percentage >= 80) {
            icon = '⚠️';
        } else if (percentage >= 50) {
            icon = '💡';
        }
        
        this.statusBarItem.text = `${icon} $${remaining.toFixed(2)}`;
        this.statusBarItem.tooltip = `SuperRez Budget: $${remaining.toFixed(2)} remaining this month (${(100 - percentage).toFixed(1)}% left)`;
        this.statusBarItem.command = 'superrez.showBudgetStatus';
    }

    // Warning thresholds
    shouldWarnBudget(): boolean {
        const percentage = (this.budget.totalSpent / this.budget.monthlyBudget) * 100;
        return percentage >= 80; // Warn at 80%
    }

    shouldBlockBudget(): boolean {
        const percentage = (this.budget.totalSpent / this.budget.monthlyBudget) * 100;
        return percentage >= 95; // Block at 95%
    }

    // Show budget report in new document
    async showBudgetReport(): Promise<void> {
        const report = this.getMonthlyReport();
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    // Cleanup method
    dispose(): void {
        this.statusBarItem.dispose();
    }
}