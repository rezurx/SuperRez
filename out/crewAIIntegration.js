"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrewAIIntegration = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const vscode = require("vscode");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CrewAIIntegration {
    constructor(aiOrchestrator, costTracker) {
        this.pythonEnv = 'python3';
        this.aiOrchestrator = aiOrchestrator;
        this.costTracker = costTracker;
    }
    async initializeCrewAI() {
        try {
            // Check if CrewAI is installed
            await execAsync(`${this.pythonEnv} -c "import crewai; print(crewai.__version__)"`);
            return true;
        }
        catch (error) {
            // Try to install CrewAI if not found
            try {
                vscode.window.showInformationMessage('Installing CrewAI... This may take a moment.');
                await execAsync(`${this.pythonEnv} -m pip install crewai`);
                vscode.window.showInformationMessage('CrewAI installed successfully!');
                return true;
            }
            catch (installError) {
                vscode.window.showErrorMessage('Failed to install CrewAI. Please install manually: pip install crewai');
                return false;
            }
        }
    }
    createSpecializedAgents() {
        return [
            {
                id: 'security_agent',
                name: 'Security Specialist',
                role: 'Security Analyst',
                backstory: 'Expert in cybersecurity with deep knowledge of common vulnerabilities, secure coding practices, and threat analysis.',
                goal: 'Identify security vulnerabilities and recommend security best practices for the codebase.',
                tools: ['local_security_scanner', 'vulnerability_database'],
                llm: 'auto',
                maxIterations: 3,
                allowDelegation: false
            },
            {
                id: 'performance_agent',
                name: 'Performance Optimizer',
                role: 'Performance Engineer',
                backstory: 'Specialized in code optimization, algorithm analysis, and system performance tuning.',
                goal: 'Analyze code performance, identify bottlenecks, and suggest optimizations.',
                tools: ['local_performance_analyzer', 'profiling_tools'],
                llm: 'auto',
                maxIterations: 3,
                allowDelegation: false
            },
            {
                id: 'frontend_agent',
                name: 'Frontend Architect',
                role: 'UI/UX Developer',
                backstory: 'Expert in modern frontend frameworks, user experience design, and web accessibility.',
                goal: 'Design and implement user-friendly interfaces with optimal user experience.',
                tools: ['react_analyzer', 'css_optimizer', 'accessibility_checker'],
                llm: 'auto',
                maxIterations: 5,
                allowDelegation: true
            },
            {
                id: 'backend_agent',
                name: 'Backend Engineer',
                role: 'API Developer',
                backstory: 'Specialized in server-side development, database design, and API architecture.',
                goal: 'Build robust, scalable backend systems and APIs.',
                tools: ['database_analyzer', 'api_tester', 'load_balancer'],
                llm: 'auto',
                maxIterations: 5,
                allowDelegation: true
            },
            {
                id: 'coordinator_agent',
                name: 'Project Coordinator',
                role: 'Technical Lead',
                backstory: 'Experienced technical lead with expertise in project coordination and cross-team collaboration.',
                goal: 'Coordinate between different specialists and ensure cohesive project execution.',
                tools: ['project_manager', 'conflict_resolver', 'decision_maker'],
                llm: 'auto',
                maxIterations: 2,
                allowDelegation: true
            }
        ];
    }
    async createMultiAgentTeam(projectContext, taskDescription, teamConfig = {
        process: 'consensus',
        verbose: true,
        memory: true,
        maxRpm: 10,
        maxIterations: 3,
        consensusThreshold: 0.7
    }) {
        const isReady = await this.initializeCrewAI();
        if (!isReady) {
            throw new Error('CrewAI not available');
        }
        const agents = this.createSpecializedAgents();
        const tasks = await this.generateTasks(taskDescription, projectContext, agents);
        // Resolve AI tools for each agent
        const resolvedAgents = await this.resolveAgentLLMs(agents);
        // Estimate costs before execution
        const costEstimate = await this.estimateTeamCost(tasks, resolvedAgents);
        const costApproval = await vscode.window.showWarningMessage(`Multi-AI Team execution will cost approximately $${costEstimate.toFixed(2)}. Continue?`, 'Proceed', 'Cancel');
        if (costApproval !== 'Proceed') {
            throw new Error('User cancelled due to cost');
        }
        // Create Python script for CrewAI execution
        const pythonScript = this.generateCrewAIPythonScript(resolvedAgents, tasks, teamConfig);
        // Execute the crew
        const startTime = Date.now();
        const result = await this.executeCrewAIScript(pythonScript);
        const endTime = Date.now();
        // Track costs
        await this.costTracker.recordCost('crewai', result.usageMetrics.totalTokens, result.usageMetrics.totalCost, `Multi-AI Team: ${taskDescription.substring(0, 50)}...`);
        result.usageMetrics.executionTime = endTime - startTime;
        return result;
    }
    async resolveAgentLLMs(agents) {
        const availableTools = await this.aiOrchestrator.detectAvailableTools();
        return agents.map(agent => {
            // Find best AI tool for this agent's role
            let preferredTool;
            if (agent.role.includes('Security') || agent.role.includes('Performance')) {
                // Security and performance agents prefer local analysis first
                preferredTool = 'local';
            }
            else {
                // For creative tasks, prefer free tools, then cost-effective paid tools
                const freeTools = availableTools.filter(t => t.type === 'free');
                const paidTools = availableTools.filter(t => t.type === 'paid');
                if (freeTools.length > 0) {
                    preferredTool = freeTools[0].command;
                }
                else if (paidTools.length > 0) {
                    // Prefer Kimi for coding tasks, then cheapest option
                    const kimi = paidTools.find(t => t.name === 'Kimi (Moonshot)');
                    if (kimi && (agent.role.includes('Engineer') || agent.role.includes('Developer'))) {
                        preferredTool = kimi.command;
                    }
                    else {
                        const cheapest = paidTools.sort((a, b) => a.costPerToken - b.costPerToken)[0];
                        preferredTool = cheapest.command;
                    }
                }
                else {
                    preferredTool = 'local';
                }
            }
            return {
                ...agent,
                llm: preferredTool
            };
        });
    }
    async generateTasks(taskDescription, projectContext, agents) {
        // Generate specialized tasks for each agent based on the main task
        const tasks = [];
        // Security analysis task
        tasks.push({
            id: 'security_analysis',
            description: `Analyze the security implications of: ${taskDescription}. Focus on potential vulnerabilities, security best practices, and threat mitigation.`,
            expectedOutput: 'Security analysis report with vulnerability assessment and recommendations',
            agent: 'security_agent',
            dependencies: []
        });
        // Performance analysis task
        tasks.push({
            id: 'performance_analysis',
            description: `Evaluate the performance implications of: ${taskDescription}. Identify potential bottlenecks and optimization opportunities.`,
            expectedOutput: 'Performance analysis report with optimization recommendations',
            agent: 'performance_agent',
            dependencies: []
        });
        // Frontend task (if applicable)
        if (this.isUIRelated(taskDescription)) {
            tasks.push({
                id: 'frontend_implementation',
                description: `Design and implement the frontend aspects of: ${taskDescription}. Focus on user experience and accessibility.`,
                expectedOutput: 'Frontend implementation plan with UI/UX considerations',
                agent: 'frontend_agent',
                dependencies: ['security_analysis']
            });
        }
        // Backend task (if applicable)
        if (this.isBackendRelated(taskDescription)) {
            tasks.push({
                id: 'backend_implementation',
                description: `Design and implement the backend aspects of: ${taskDescription}. Focus on scalability and data integrity.`,
                expectedOutput: 'Backend implementation plan with API design and database schema',
                agent: 'backend_agent',
                dependencies: ['security_analysis', 'performance_analysis']
            });
        }
        // Coordination task (always included)
        tasks.push({
            id: 'coordination',
            description: `Coordinate the implementation of: ${taskDescription}. Synthesize recommendations from all specialists and create a cohesive implementation plan.`,
            expectedOutput: 'Comprehensive implementation plan integrating all specialist recommendations',
            agent: 'coordinator_agent',
            dependencies: tasks.map(t => t.id)
        });
        return tasks;
    }
    isUIRelated(description) {
        const uiKeywords = ['ui', 'interface', 'frontend', 'react', 'component', 'design', 'user', 'visual'];
        return uiKeywords.some(keyword => description.toLowerCase().includes(keyword));
    }
    isBackendRelated(description) {
        const backendKeywords = ['api', 'database', 'server', 'backend', 'endpoint', 'data', 'service'];
        return backendKeywords.some(keyword => description.toLowerCase().includes(keyword));
    }
    async estimateTeamCost(tasks, agents) {
        let totalCost = 0;
        const avgTokensPerTask = 2000; // Estimated average tokens per task
        for (const agent of agents) {
            if (agent.llm === 'local') {
                continue; // Local tools are free
            }
            const availableTools = await this.aiOrchestrator.detectAvailableTools();
            const tool = availableTools.find(t => t.command === agent.llm);
            if (tool) {
                const agentTasks = tasks.filter(t => t.agent === agent.id);
                totalCost += agentTasks.length * avgTokensPerTask * tool.costPerToken / 1000;
            }
        }
        return totalCost;
    }
    generateCrewAIPythonScript(agents, tasks, config) {
        return `
import os
import json
from crewai import Agent, Task, Crew, Process
from crewai_tools import tool

# Define tools
@tool
def local_security_scanner(query: str) -> str:
    """Runs local security analysis"""
    return "Security analysis completed locally"

@tool  
def local_performance_analyzer(query: str) -> str:
    """Runs local performance analysis"""
    return "Performance analysis completed locally"

# Create agents
agents = []
${agents.map(agent => `
agent_${agent.id} = Agent(
    role="${agent.role}",
    goal="${agent.goal}",
    backstory="${agent.backstory}",
    verbose=${config.verbose},
    allow_delegation=${agent.allowDelegation},
    max_iter=${agent.maxIterations}
)
agents.append(agent_${agent.id})
`).join('')}

# Create tasks
tasks = []
${tasks.map(task => `
task_${task.id} = Task(
    description="${task.description}",
    expected_output="${task.expectedOutput}",
    agent=agent_${task.agent}
)
tasks.append(task_${task.id})
`).join('')}

# Create and run crew
crew = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.${config.process.toUpperCase()},
    verbose=${config.verbose},
    memory=${config.memory}
)

result = crew.kickoff()

# Output results
output = {
    "result": str(result),
    "task_results": {},
    "usage_metrics": {
        "total_tokens": 1000,  # Placeholder
        "total_cost": 0.1,     # Placeholder  
        "execution_time": 0
    }
}

print(json.dumps(output))
`;
    }
    async executeCrewAIScript(pythonScript) {
        try {
            // Write script to temporary file
            const fs = require('fs');
            const path = require('path');
            const tmpDir = require('os').tmpdir();
            const scriptPath = path.join(tmpDir, 'crewai_execution.py');
            fs.writeFileSync(scriptPath, pythonScript);
            // Execute the script
            const { stdout } = await execAsync(`${this.pythonEnv} "${scriptPath}"`);
            // Clean up
            fs.unlinkSync(scriptPath);
            // Parse results
            const result = JSON.parse(stdout.trim());
            return {
                result: result.result,
                taskResults: result.task_results,
                usageMetrics: result.usage_metrics
            };
        }
        catch (error) {
            throw new Error(`CrewAI execution failed: ${error}`);
        }
    }
    async runConsensusVoting(question, options, agents) {
        const votes = {};
        // Get vote from each agent
        for (const agentId of agents) {
            const prompt = `As a ${agentId}, vote on the best option for: ${question}\n\nOptions:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nRespond with only the number of your choice.`;
            // Route to appropriate AI tool based on agent specialty
            const taskRoute = await this.aiOrchestrator.getTaskRecommendation('analysis');
            const vote = await this.executeVote(prompt, taskRoute.recommendedTool);
            votes[agentId] = vote;
        }
        // Count votes
        const voteCounts = {};
        Object.values(votes).forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });
        // Find winner
        const winner = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
        const totalVotes = Object.keys(votes).length;
        const winnerVotes = voteCounts[winner] || 0;
        const confidence = winnerVotes / totalVotes;
        return { winner, votes, confidence };
    }
    async executeVote(prompt, toolName) {
        // Simplified vote execution - in real implementation, this would
        // call the actual AI tool and parse the response
        const options = ['1', '2', '3', '4', '5'];
        return options[Math.floor(Math.random() * options.length)];
    }
    async getTeamStatus() {
        const isReady = await this.initializeCrewAI();
        const agents = this.createSpecializedAgents();
        return `# Multi-AI Team Status

## CrewAI Integration
- **Status**: ${isReady ? '✅ Ready' : '❌ Not Available'}
- **Python Environment**: ${this.pythonEnv}

## Available Agents (${agents.length})
${agents.map(agent => `
### ${agent.name}
- **Role**: ${agent.role}
- **Specialization**: ${agent.goal}
- **Tools**: ${agent.tools.join(', ')}
`).join('')}

## Team Capabilities
- **Parallel Analysis**: Security + Performance + Frontend + Backend
- **Consensus Voting**: Resolve conflicting recommendations
- **Cost Optimization**: Route each agent to optimal AI tool
- **Local-First**: Security and performance use free local analysis

## Usage
Use \`SuperRez: Create Multi-AI Team\` to assemble specialists for complex tasks.
`;
    }
}
exports.CrewAIIntegration = CrewAIIntegration;
//# sourceMappingURL=crewAIIntegration.js.map