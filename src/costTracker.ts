import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CostEntry {
    timestamp: string;
    tool: string;
    tokens: number;
    cost: number;
    description: string;
}

export interface BudgetStatus {
    budget: number;
    spent: number;
    remaining: number;
    currentMonth: string;
}

export class CostTracker {
    private costFile: string;
    private costData: {
        monthly_budget: number;
        current_month: string;
        spent: number;
        calls: CostEntry[];
    } = {
        monthly_budget: 50.0,
        current_month: new Date().toISOString().substring(0, 7),
        spent: 0.0,
        calls: []
    };

    constructor(private context: vscode.ExtensionContext) {
        this.costFile = path.join(context.globalStorageUri.fsPath, 'superrez-costs.json');
        this.loadCostData();
    }

    estimateCost(prompt: string, toolName?: string): number {
        // Rough token estimation: ~4 characters per token
        const tokens = Math.ceil(prompt.length / 4);
        
        // Cost estimates per 1K tokens (as of 2024)
        const costs = {
            'claude-3-sonnet': 0.003,
            'claude-3-haiku': 0.00025,
            'gpt-4': 0.03,
            'gpt-3.5-turbo': 0.002,
            'gemini-pro': 0.001,
            'moonshot-v1-8k': 0.0015,
            'kimi-k2': 0.015
        };

        // If tool is specified, use its specific cost
        if (toolName) {
            const toolCost = this.getToolSpecificCost(toolName, costs);
            if (toolCost !== null) {
                return (tokens / 1000) * toolCost;
            }
        }

        // Use average cost for estimation
        const avgCost = Object.values(costs).reduce((a, b) => a + b, 0) / Object.values(costs).length;
        return (tokens / 1000) * avgCost;
    }

    private getToolSpecificCost(toolName: string, costs: { [key: string]: number }): number | null {
        const toolMapping: { [key: string]: string } = {
            'Claude Code': 'claude-3-sonnet',
            'Gemini CLI': 'gemini-pro', 
            'GitHub Copilot': 'gpt-4',
            'Kimi (Moonshot)': 'moonshot-v1-8k',
            'Ollama': 'free',
            'Local AI (Mock)': 'free'
        };

        const costKey = toolMapping[toolName];
        if (costKey === 'free') {
            return 0.0;
        }
        return costs[costKey] || null;
    }

    async recordCost(tool: string, tokens: number, cost: number, description: string): Promise<void> {
        const entry: CostEntry = {
            timestamp: new Date().toISOString(),
            tool,
            tokens,
            cost,
            description
        };

        this.costData.calls.push(entry);
        this.costData.spent += cost;
        
        await this.saveCostData();
        
        // Check if budget exceeded
        if (this.costData.spent > this.costData.monthly_budget) {
            vscode.window.showWarningMessage(
                `⚠️ Monthly budget exceeded! Spent: $${this.costData.spent.toFixed(2)} / $${this.costData.monthly_budget.toFixed(2)}`,
                'View Details'
            );
        }
    }

    getBudgetStatus(): BudgetStatus {
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        // Reset if new month
        if (this.costData.current_month !== currentMonth) {
            this.costData.current_month = currentMonth;
            this.costData.spent = 0;
            this.costData.calls = [];
            this.saveCostData();
        }

        return {
            budget: this.costData.monthly_budget,
            spent: this.costData.spent,
            remaining: this.costData.monthly_budget - this.costData.spent,
            currentMonth: this.costData.current_month
        };
    }

    async checkBudget(estimatedCost: number): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('superrez');
        const showWarnings = config.get<boolean>('showCostWarnings', true);
        
        if (!showWarnings) {
            return true;
        }

        const status = this.getBudgetStatus();
        const newTotal = status.spent + estimatedCost;
        
        if (newTotal > status.budget) {
            const choice = await vscode.window.showWarningMessage(
                `This operation would exceed your monthly budget!\n` +
                `Current: $${status.spent.toFixed(2)} + $${estimatedCost.toFixed(2)} = $${newTotal.toFixed(2)}\n` +
                `Budget: $${status.budget.toFixed(2)}`,
                'Proceed Anyway',
                'Cancel'
            );
            
            return choice === 'Proceed Anyway';
        }

        if (newTotal > status.budget * 0.8) {
            const choice = await vscode.window.showWarningMessage(
                `You're approaching your monthly budget limit!\n` +
                `Current: $${status.spent.toFixed(2)} + $${estimatedCost.toFixed(2)} = $${newTotal.toFixed(2)}\n` +
                `Budget: $${status.budget.toFixed(2)}`,
                'Proceed',
                'Cancel'
            );
            
            return choice === 'Proceed';
        }

        return true;
    }

    getMonthlyReport(): string {
        const status = this.getBudgetStatus();
        const calls = this.costData.calls;
        
        const report = `# SuperRez Monthly Cost Report

**Month:** ${status.currentMonth}
**Budget:** $${status.budget.toFixed(2)}
**Spent:** $${status.spent.toFixed(2)}
**Remaining:** $${status.remaining.toFixed(2)}

## Usage by Tool
${this.getToolUsage()}

## Recent Calls
${calls.slice(-10).map(call => 
    `- ${call.timestamp.substring(0, 16)} - ${call.tool} - $${call.cost.toFixed(3)} - ${call.description}`
).join('\n')}

## Cost-Saving Tips
- Use local security analysis (FREE)
- Prefer shorter prompts when possible
- Use free tools like Ollama for routine tasks
- Batch similar requests together
`;

        return report;
    }

    private getToolUsage(): string {
        const toolStats = this.costData.calls.reduce((acc, call) => {
            if (!acc[call.tool]) {
                acc[call.tool] = { cost: 0, count: 0 };
            }
            acc[call.tool].cost += call.cost;
            acc[call.tool].count += 1;
            return acc;
        }, {} as { [tool: string]: { cost: number; count: number } });

        return Object.entries(toolStats)
            .map(([tool, stats]) => `- ${tool}: $${stats.cost.toFixed(2)} (${stats.count} calls)`)
            .join('\n');
    }

    private loadCostData(): void {
        try {
            if (fs.existsSync(this.costFile)) {
                this.costData = JSON.parse(fs.readFileSync(this.costFile, 'utf8'));
            } else {
                this.initializeCostData();
            }
        } catch (error) {
            console.error('Failed to load cost data:', error);
            this.initializeCostData();
        }
    }

    private initializeCostData(): void {
        this.costData = {
            monthly_budget: 50.0,
            current_month: new Date().toISOString().substring(0, 7),
            spent: 0.0,
            calls: []
        };
    }

    private async saveCostData(): Promise<void> {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.costFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.costFile, JSON.stringify(this.costData, null, 2));
        } catch (error) {
            console.error('Failed to save cost data:', error);
        }
    }
}