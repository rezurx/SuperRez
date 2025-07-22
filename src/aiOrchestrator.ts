import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { LocalAIManager } from './localAI';

const execAsync = promisify(exec);

export interface AITool {
    name: string;
    command: string;
    available: boolean;
    costPerToken: number;
    strengths: string[];
    type: 'free' | 'paid';
    description: string;
}

export interface TaskRoute {
    taskType: 'analysis' | 'completion' | 'generation' | 'security' | 'performance';
    recommendedTool: string;
    alternatives: string[];
    rationale: string;
}

export class AIOrchestrator {
    private availableTools: AITool[] = [];
    private detectionComplete: boolean = false;
    private localAIManager: LocalAIManager;

    constructor() {
        this.localAIManager = new LocalAIManager();
        this.initializeToolDefinitions();
    }

    private initializeToolDefinitions(): void {
        this.availableTools = [
            {
                name: 'Claude Code',
                command: 'claude',
                available: false,
                costPerToken: 0.003,
                strengths: ['analysis', 'reasoning', 'code review', 'architecture'],
                type: 'paid',
                description: 'Excellent reasoning and code analysis'
            },
            {
                name: 'Gemini CLI',
                command: 'gemini',
                available: false,
                costPerToken: 0.001,
                strengths: ['general purpose', 'fast responses', 'cost effective'],
                type: 'paid',
                description: 'Fast, cost-effective general purpose AI'
            },
            {
                name: 'GitHub Copilot',
                command: 'gh copilot',
                available: false,
                costPerToken: 0.002,
                strengths: ['code completion', 'suggestions', 'inline help'],
                type: 'paid',
                description: 'Best-in-class code completion'
            },
            {
                name: 'Ollama',
                command: 'ollama',
                available: false,
                costPerToken: 0.0,
                strengths: ['privacy', 'offline', 'unlimited usage'],
                type: 'free',
                description: 'Local models for privacy and zero cost'
            },
            {
                name: 'Kimi (Moonshot)',
                command: 'kimi',
                available: false,
                costPerToken: 0.0015,
                strengths: ['coding', 'algorithms', 'mathematical optimization'],
                type: 'paid',
                description: 'Superior coding capabilities, competitive pricing'
            },
            {
                name: 'Cursor',
                command: 'cursor',
                available: false,
                costPerToken: 0.002,
                strengths: ['IDE integration', 'context awareness', 'code editing'],
                type: 'paid',
                description: 'AI-powered code editor with context awareness'
            },
            {
                name: 'Local AI (Mock)',
                command: 'mock-local',
                available: false,
                costPerToken: 0.0,
                strengths: ['zero cost', 'privacy', 'instant response', 'testing'],
                type: 'free',
                description: 'Mock local AI for testing and development'
            }
        ];
    }

    async detectAvailableTools(): Promise<AITool[]> {
        if (this.detectionComplete) {
            return this.availableTools.filter(tool => tool.available);
        }

        // Check standard tools
        const detectionPromises = this.availableTools.map(tool => this.checkToolAvailability(tool));
        await Promise.all(detectionPromises);
        
        // Check local AI providers
        await this.detectLocalAIProviders();
        
        this.detectionComplete = true;
        return this.availableTools.filter(tool => tool.available);
    }

    private async detectLocalAIProviders(): Promise<void> {
        try {
            const localProviders = await this.localAIManager.detectAvailableProviders();
            
            // Update availability for local AI tools
            for (const tool of this.availableTools) {
                if (tool.command === 'mock-local') {
                    // Mock local AI is always available for testing
                    tool.available = true;
                } else if (tool.command === 'ollama') {
                    // Check if Ollama provider is available
                    tool.available = localProviders.some(p => p.name === 'Ollama');
                }
            }
        } catch (error) {
            console.error('Error detecting local AI providers:', error);
        }
    }

    private async checkToolAvailability(tool: AITool): Promise<void> {
        try {
            // Check if command exists
            await execAsync(`which ${tool.command.split(' ')[0]}`);
            
            // Additional checks for specific tools
            switch (tool.name) {
                case 'Claude Code':
                    try {
                        await execAsync('claude --version');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                case 'Gemini CLI':
                    try {
                        await execAsync('gemini --version');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                case 'GitHub Copilot':
                    try {
                        await execAsync('gh copilot --version');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                case 'Ollama':
                    try {
                        await execAsync('ollama list');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                case 'Kimi (Moonshot)':
                    try {
                        await execAsync('./kimi --version');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                case 'Cursor':
                    // Check if cursor is installed
                    try {
                        await execAsync('cursor --version');
                        tool.available = true;
                    } catch {
                        tool.available = false;
                    }
                    break;
                    
                default:
                    tool.available = true;
            }
        } catch {
            tool.available = false;
        }
    }

    async getTaskRecommendation(
        taskType: 'analysis' | 'completion' | 'generation' | 'security' | 'performance',
        promptLength: number = 1000,
        userPreference?: string
    ): Promise<TaskRoute> {
        const availableTools = await this.detectAvailableTools();
        
        if (availableTools.length === 0) {
            return {
                taskType,
                recommendedTool: 'none',
                alternatives: [],
                rationale: 'No AI tools detected. Please install Claude Code, Gemini CLI, or Ollama.'
            };
        }

        // Check user preference first
        if (userPreference && userPreference !== 'auto') {
            const preferredTool = availableTools.find(t => 
                t.name.toLowerCase().includes(userPreference.toLowerCase()) ||
                t.command.includes(userPreference)
            );
            
            if (preferredTool) {
                return {
                    taskType,
                    recommendedTool: preferredTool.name,
                    alternatives: availableTools.filter(t => t.name !== preferredTool.name).map(t => t.name),
                    rationale: `Using user preference: ${preferredTool.name}`
                };
            }
        }

        // Smart routing based on task type
        const recommendation = this.getSmartRecommendation(taskType, availableTools, promptLength);
        
        return {
            taskType,
            recommendedTool: recommendation.primary.name,
            alternatives: recommendation.alternatives.map(t => t.name),
            rationale: recommendation.rationale
        };
    }

    private getSmartRecommendation(
        taskType: string,
        availableTools: AITool[],
        promptLength: number
    ): { primary: AITool; alternatives: AITool[]; rationale: string } {
        
        // Prioritize free tools when available
        const freeTools = availableTools.filter(t => t.type === 'free');
        const paidTools = availableTools.filter(t => t.type === 'paid');
        
        switch (taskType) {
            case 'analysis':
                // Claude Code is best for analysis, but prefer free if available
                if (freeTools.length > 0) {
                    const ollama = freeTools.find(t => t.name === 'Ollama');
                    if (ollama) {
                        return {
                            primary: ollama,
                            alternatives: [...paidTools],
                            rationale: 'Using Ollama for free analysis. Upgrade to Claude Code for superior reasoning.'
                        };
                    }
                }
                
                const claude = paidTools.find(t => t.name === 'Claude Code');
                const kimiAnalysis = paidTools.find(t => t.name === 'Kimi (Moonshot)');
                
                if (claude) {
                    return {
                        primary: claude,
                        alternatives: [...freeTools, ...paidTools.filter(t => t.name !== 'Claude Code')],
                        rationale: 'Claude Code excels at analysis and reasoning tasks.'
                    };
                } else if (kimiAnalysis) {
                    return {
                        primary: kimiAnalysis,
                        alternatives: [...freeTools, ...paidTools.filter(t => t.name !== 'Kimi (Moonshot)')],
                        rationale: 'Kimi K2 offers superior coding and algorithmic analysis capabilities.'
                    };
                }
                break;

            case 'completion':
                // Copilot is best for completion
                const copilot = paidTools.find(t => t.name === 'GitHub Copilot');
                if (copilot) {
                    return {
                        primary: copilot,
                        alternatives: [...freeTools, ...paidTools.filter(t => t.name !== 'GitHub Copilot')],
                        rationale: 'GitHub Copilot is best-in-class for code completion.'
                    };
                }
                break;

            case 'generation':
                // For cost-effective generation, prefer Gemini or free tools
                if (freeTools.length > 0) {
                    return {
                        primary: freeTools[0],
                        alternatives: [...paidTools],
                        rationale: 'Using free tool for code generation to minimize costs.'
                    };
                }

                const gemini = paidTools.find(t => t.name === 'Gemini CLI');
                const kimiGeneration = paidTools.find(t => t.name === 'Kimi (Moonshot)');
                
                if (kimiGeneration) {
                    return {
                        primary: kimiGeneration,
                        alternatives: [...freeTools, ...paidTools.filter(t => t.name !== 'Kimi (Moonshot)')],
                        rationale: 'Kimi K2 excels at code generation with competitive pricing.'
                    };
                } else if (gemini) {
                    return {
                        primary: gemini,
                        alternatives: [...freeTools, ...paidTools.filter(t => t.name !== 'Gemini CLI')],
                        rationale: 'Gemini CLI offers good performance at lower cost.'
                    };
                }
                break;
                
            case 'security':
                // Security analysis - prefer local first, then Claude
                return {
                    primary: { name: 'Local Analysis', command: 'local', available: true, costPerToken: 0, strengths: ['security'], type: 'free', description: 'Built-in security scanner' },
                    alternatives: availableTools,
                    rationale: 'Using built-in security scanner (FREE). AI analysis available if needed.'
                };
                
            case 'performance':
                // Performance analysis - prefer local first
                return {
                    primary: { name: 'Local Analysis', command: 'local', available: true, costPerToken: 0, strengths: ['performance'], type: 'free', description: 'Built-in performance analyzer' },
                    alternatives: availableTools,
                    rationale: 'Using built-in performance analyzer (FREE). AI analysis available if needed.'
                };
        }

        // Default fallback - prefer free tools
        if (freeTools.length > 0) {
            return {
                primary: freeTools[0],
                alternatives: [...paidTools],
                rationale: 'Using free tool to minimize costs.'
            };
        }

        // If no free tools, use cheapest paid tool
        if (paidTools.length > 0) {
            const cheapestTool = paidTools.sort((a, b) => a.costPerToken - b.costPerToken)[0];
            return {
                primary: cheapestTool,
                alternatives: paidTools.filter(t => t.name !== cheapestTool.name),
                rationale: `Using ${cheapestTool.name} as most cost-effective option.`
            };
        }

        // This should not be reached if there are available tools, but as a fallback:
        return { 
            primary: { name: 'none', command: '', available: false, costPerToken: 0, strengths: [], type: 'free', description: '' }, 
            alternatives: [], 
            rationale: 'No suitable AI tool found.' 
        };
    }

    async generatePrompt(
        taskType: string,
        context: any,
        toolName: string
    ): Promise<string> {
        const tool = this.availableTools.find(t => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        const basePrompt = this.getTaskSpecificPrompt(taskType, context);
        const toolSpecificPrompt = this.getToolSpecificPrompt(tool, basePrompt);
        
        return toolSpecificPrompt;
    }

    private getTaskSpecificPrompt(taskType: string, context: any): string {
        switch (taskType) {
            case 'analysis':
                return `Analyze the following code and provide insights:

Project: ${context.projectName}
Files: ${context.changedFiles || 'Multiple files'}

Focus on:
- Code quality and best practices
- Potential issues or improvements
- Architecture recommendations

${context.additionalContext || ''}`;

            case 'completion':
                return `Complete the following code snippet:

Context: ${context.description || 'Code completion request'}
Language: ${context.language || 'Auto-detect'}

${context.code || ''}`;

            case 'generation':
                return `Generate code based on the following requirements:

Requirements: ${context.requirements}
Project: ${context.projectName}
Language/Framework: ${context.framework || 'Auto-detect'}

Please provide:
- Complete implementation
- Comments explaining the code
- Any necessary imports or dependencies

${context.additionalContext || ''}`;

            case 'security':
                return `Perform security analysis on the following code:

Project: ${context.projectName}
Focus areas:
- SQL injection vulnerabilities
- XSS potential
- Authentication/authorization issues
- Data validation problems

${context.code || context.additionalContext || ''}`;

            case 'performance':
                return `Analyze performance implications of the following code:

Project: ${context.projectName}
Focus areas:
- Algorithm efficiency
- Memory usage
- Database queries
- Network requests

${context.code || context.additionalContext || ''}`;

            default:
                return `Help with the following request:

${context.description || 'General assistance needed'}

Project: ${context.projectName}
${context.additionalContext || ''}`;
        }
    }

    private getToolSpecificPrompt(tool: AITool, basePrompt: string): string {
        const costWarning = tool.type === 'paid' ? 
            `\n\n**Cost Estimate**: ~$${(basePrompt.length / 4 * tool.costPerToken / 1000).toFixed(3)} using ${tool.name}` : 
            `\n\n**Cost**: FREE using ${tool.name}`;

        return basePrompt + costWarning;
    }

    async getToolSummary(): Promise<string> {
        const availableTools = await this.detectAvailableTools();
        const unavailableTools = this.availableTools.filter(t => !t.available);

        const summary = `# AI Tools Summary

## Available Tools (${availableTools.length})
${availableTools.map(tool => `
### ${tool.name} ${tool.type === 'free' ? '(FREE)' : '($' + tool.costPerToken + '/1K tokens)'}
- **Command**: \`${tool.command}\`
- **Strengths**: ${tool.strengths.join(', ')}
- **Description**: ${tool.description}
`).join('')}

## Unavailable Tools (${unavailableTools.length})
${unavailableTools.map(tool => `
### ${tool.name} (Not Installed)
- **Install**: ${this.getInstallInstructions(tool)}
- **Strengths**: ${tool.strengths.join(', ')}
`).join('')}

## Smart Routing
- **Analysis**: ${this.getRoutingPreference('analysis', availableTools)}
- **Code Completion**: ${this.getRoutingPreference('completion', availableTools)}
- **Code Generation**: ${this.getRoutingPreference('generation', availableTools)}
- **Security**: Built-in scanner (FREE) + AI backup
- **Performance**: Built-in analyzer (FREE) + AI backup

**Total Cost Savings**: ${this.calculateCostSavings(availableTools)}`;

        return summary;
    }

    private getInstallInstructions(tool: AITool): string {
        switch (tool.name) {
            case 'Claude Code':
                return 'Visit claude.ai/code for installation instructions';
            case 'Gemini CLI':
                return 'Install from Google AI Studio';
            case 'GitHub Copilot':
                return 'gh extension install github/gh-copilot';
            case 'Ollama':
                return 'curl -fsSL https://ollama.ai/install.sh | sh';
            case 'Kimi (Moonshot)':
                return 'Set MOONSHOT_API_KEY environment variable from https://platform.moonshot.ai';
            case 'Cursor':
                return 'Download from cursor.sh';
            default:
                return 'Check official documentation';
        }
    }

    private getRoutingPreference(taskType: string, availableTools: AITool[]): string {
        const freeTools = availableTools.filter(t => t.type === 'free');
        const paidTools = availableTools.filter(t => t.type === 'paid');

        if (freeTools.length > 0) {
            return `${freeTools[0].name} (FREE) → ${paidTools.map(t => t.name).join(' → ')}`;
        }

        if (paidTools.length > 0) {
            return paidTools.sort((a, b) => a.costPerToken - b.costPerToken)
                .map(t => `${t.name} ($${t.costPerToken}/1K)`)
                .join(' → ');
        }

        return 'No tools available';
    }

    private calculateCostSavings(availableTools: AITool[]): string {
        const freeTools = availableTools.filter(t => t.type === 'free');
        const paidTools = availableTools.filter(t => t.type === 'paid');

        if (freeTools.length > 0) {
            return `Up to 100% with ${freeTools[0].name} + local analysis`;
        }

        if (paidTools.length > 1) {
            const cheapest = Math.min(...paidTools.map(t => t.costPerToken));
            const expensive = Math.max(...paidTools.map(t => t.costPerToken));
            const savings = Math.round((1 - cheapest / expensive) * 100);
            return `Up to ${savings}% by choosing optimal tool for each task`;
        }

        return 'Install free tools for maximum savings';
    }

    async generateWithLocalAI(prompt: string, provider?: string): Promise<string> {
        try {
            // Use mock local AI by default for demonstration
            const selectedProvider = provider || 'mock-local';
            const result = await this.localAIManager.generateCode(selectedProvider, prompt);
            return result;
        } catch (error) {
            throw new Error(`Local AI generation failed: ${error}`);
        }
    }

    async getLocalAISummary(): Promise<string> {
        return await this.localAIManager.getProviderSummary();
    }
}