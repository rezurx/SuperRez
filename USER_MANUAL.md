# SuperRez User Manual

**Version**: 0.2.0 (Phase 5.2 - CLI Interactive Mode)  
**Last Updated**: 2025-07-24  
**Target**: Users, Contributors, and Future Development Reference

---

## 📖 Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Installation & Setup](#installation--setup)
3. [SuperRez CLI Interactive Mode](#superrez-cli-interactive-mode)
4. [Core Features](#core-features)
5. [Command Reference](#command-reference)
6. [Template Engine Guide](#template-engine-guide)
7. [AI Tool Integration](#ai-tool-integration)
8. [Cost Management](#cost-management)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)
11. [Development Reference](#development-reference)

---

## 🚀 Quick Start Guide

### **30-Second Setup**
1. **Install SuperRez** from VSCode marketplace (or load from VSIX)
2. **Open Command Palette**: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. **Run**: `SuperRez: Start Session`
4. **Select your project** from the discovered list
5. **Start using SuperRez commands!**

### **First Session Workflow**
```
1. SuperRez: Start Session → Select project
2. SuperRez: Analyze Security → FREE local scan
3. SuperRez: Generate From Template → Create code instantly
4. SuperRez: Show AI Tools → See available AI integrations
5. SuperRez: End Session → Get AI-ready project summary
```

### **Look for SuperRez**
- **Status Bar**: "⚡ SuperRez" indicator at bottom of VSCode
- **Command Palette**: All commands start with "SuperRez:"
- **Output Panels**: Rich formatted results in dedicated channels

---

## 🔧 Installation & Setup

### **Method 1: VSCode Marketplace (Recommended)**
```bash
# Search for "SuperRez" in VSCode Extensions
# Click Install
```

### **Method 2: VSIX Package (Development)**
```bash
# Download superrez-0.1.0.vsix
# Command Palette → Extensions: Install from VSIX...
# Select the VSIX file
# Restart VSCode
```

### **Method 3: Development Build**
```bash
git clone https://github.com/rezurx/SuperRez
cd SuperRez
npm install
npm run compile
# Press F5 in VSCode to launch Extension Development Host
```

### **Verify Installation**
1. **Check Status Bar**: Look for "⚡ SuperRez" 
2. **Command Palette**: Type "SuperRez" - should show 18 commands
3. **Test Command**: Run `SuperRez: Show Status`

---

## 🖥️ SuperRez CLI Interactive Mode

**NEW in Phase 5.2**: Professional command-line interface with 95% cost reduction

### **🚀 CLI Installation**
```bash
# Clone the CLI repository
git clone https://github.com/rezurx/SuperRez-CLI.git
cd SuperRez-CLI

# Install dependencies and build
npm install
npm run build

# Run directly or install globally
node dist/index.js --help
# OR install globally (future)
npm install -g superrez-cli
```

### **💻 Interactive Mode Features**

#### **Professional REPL Interface**
```bash
# Start interactive mode
superrez interactive

╔══════════════════════════════════════════════════════════════╗
║               🚀 SuperRez Interactive Mode                   ║
║     Cost-aware AI development assistant CLI v1.0.0          ║
╚══════════════════════════════════════════════════════════════╝

📁 Active Session: myproject
💰 Budget: $0.00/$50.00 (100% remaining)

SuperRez > _
```

#### **Tab Completion System**
- **Commands**: `st[TAB]` → `start`
- **Subcommands**: `analyze [TAB]` → `security`, `performance`, `all`  
- **AI Options**: `ai [TAB]` → `tools`, `route`, `prompt`
- **Projects**: `start [TAB]` → Auto-complete project names

#### **Rich Terminal UI**
- **Progress Indicators**: Real-time spinners for operations
- **Color-Coded Status**: Green/yellow/red for budget levels
- **Live Updates**: Session and budget status refresh automatically
- **Error Handling**: User-friendly error messages with suggestions

### **🎯 CLI vs VSCode Extension**

| Feature | VSCode Extension | CLI Interactive Mode |
|---------|------------------|---------------------|
| **Session Management** | ✅ 18 commands | ✅ All commands available |
| **Local Analysis** | ✅ Security + Performance | ✅ Security + Performance |
| **AI Orchestration** | ✅ 8+ AI tools | ✅ 8+ AI tools |
| **Cost Tracking** | ✅ Budget enforcement | ✅ Budget enforcement |
| **User Interface** | VSCode integration | Rich terminal UI |
| **Tab Completion** | N/A | ✅ Full auto-completion |
| **Portability** | Requires VSCode | ✅ Works anywhere |

### **🔧 CLI Command Examples**

#### **Interactive Session Workflow**
```bash
SuperRez > start myproject        # Start session with tab completion
- Starting session...
✓ Session started successfully

SuperRez > analyze all           # Run comprehensive analysis (FREE)
- Running comprehensive analysis...
✓ All analyses completed

SuperRez > ai tools              # Show available AI tools  
- Loading AI tools...
✓ Found: Claude Code, Gemini CLI, Ollama, Kimi K2

SuperRez > status                # Check session and budget
📁 Active Session: myproject
💰 Budget: $0.00/$50.00 (100% remaining)

SuperRez > exit                  # Exit gracefully
👋 Goodbye! SuperRez session ended.
```

#### **Direct CLI Commands**
```bash
# Use without interactive mode
superrez start myproject         # Start session
superrez analyze --security      # Security scan (FREE)
superrez ai --tools               # Show AI tools
superrez status                   # Show status
```

---

## ⭐ Core Features

### **🎯 Session Management**
**Purpose**: Smart project discovery and context management

**Key Benefits**:
- **Automatic Project Discovery**: Finds projects with progress files
- **Context Loading**: Gathers Git status, file structure, recent changes
- **Smart Prompts**: Generates AI-ready summaries with cost estimates
- **Persistent Sessions**: Resume work across VSCode restarts

**Usage**:
```
SuperRez: Start Session → Pick from 6+ discovered projects
SuperRez: Show Status → View active session and budget
SuperRez: End Session → Generate AI prompt with full context
SuperRez: Clear Session → Force clear without prompts
```

### **🛡️ Local Security Analysis (FREE)**
**Purpose**: Professional vulnerability scanning without API costs

**Detects**:
- **Hardcoded Secrets**: API keys, passwords, tokens, private keys
- **SQL Injection**: String concatenation in database queries  
- **XSS Vulnerabilities**: innerHTML, eval, dangerous HTML patterns
- **Weak Cryptography**: MD5, SHA1, Math.random usage
- **Path Traversal**: Directory traversal attack patterns

**Performance**: Scans 4,761 files in ~3 seconds

**Usage**:
```
SuperRez: Analyze Security
→ Comprehensive vulnerability report
→ HIGH/MEDIUM/LOW severity classification
→ Actionable security recommendations
→ Zero API costs - 100% local analysis
```

### **⚡ Performance Analysis (FREE)**
**Purpose**: Local performance bottleneck detection

**Analyzes**:
- **Algorithmic Complexity**: Nested loops, O(n²) operations
- **Memory Usage**: Leaks, inefficient allocations
- **Async Operations**: Sequential vs parallel patterns
- **Database Queries**: N+1 problems, SELECT * inefficiencies
- **Network Requests**: Fetch patterns and polling issues
- **React Performance**: useEffect, inline functions, key props

**Results**: Finds 123+ performance issues across categories

**Usage**:
```
SuperRez: Analyze Performance
→ Detailed performance bottleneck report
→ Optimization recommendations
→ Framework-specific insights
→ Zero API costs - 100% local analysis
```

### **🤖 AI Tool Orchestration**
**Purpose**: Smart routing to optimal AI tools with cost optimization

**Supported AI Tools**:
- **Claude Code**: Best for analysis and reasoning
- **Gemini CLI**: Cost-effective general purpose
- **GitHub Copilot**: Superior code completion
- **Ollama**: Free local models for privacy
- **Kimi (Moonshot)**: Advanced coding capabilities
- **Cursor**: AI-powered IDE integration

**Smart Routing Logic**:
```
Analysis Tasks: Ollama (free) → Claude Code → Gemini CLI
Code Completion: GitHub Copilot → Cursor → Local models
Code Generation: Ollama (free) → Gemini CLI → Claude Code
Security/Performance: Built-in scanners (FREE) → AI backup
```

**Usage**:
```
SuperRez: Show AI Tools → View available tools and status
SuperRez: Route Task to AI → Get recommendations for specific tasks
SuperRez: Generate Smart Prompt → Context-aware prompts with cost estimates
```

### **🏗️ Template Engine (NEW - Phase 4.1)**
**Purpose**: Intelligent code generation with project pattern adaptation

**Built-in Templates**:
- **React Component**: Functional components with TypeScript
- **Express Route**: API routes with error handling
- **FastAPI Route**: Python API with Pydantic models
- **Jest Test**: Test files with proper structure

**Smart Features**:
- **Pattern Detection**: Auto-detects indentation, quotes, imports
- **Framework Detection**: Recognizes React, Express, FastAPI, Next.js
- **Context Awareness**: Uses active session project context
- **Variable Collection**: Interactive UI for template customization

**Usage**:
```
SuperRez: Generate From Template
→ Select template (React Component, Express Route, etc.)
→ Enter variables (component name, route path, etc.)
→ Generated code opens in new VSCode document

SuperRez: Manage Templates
→ View all templates, by category, or statistics
→ Template library management interface
```

### **🧠 Advanced Consensus Engine (NEW - Phase 4.2)**
**Purpose**: Mathematical consensus algorithms for multi-agent decision making

**Consensus Methods**:
- **Simple Majority**: Democratic voting with confidence weighting
- **Weighted Majority**: Custom weight functions for agent expertise levels
- **Confidence Weighted**: Harmonic mean confidence scoring for quality decisions
- **Byzantine Fault Tolerant**: Safety-critical consensus with fault tolerance (handles up to 1/3 faulty agents)
- **Rank Aggregation**: Borda count method for complex preference ordering
- **Fuzzy Consensus**: Partial agreement handling with similarity matching
- **Cost Optimized**: Maximum quality per dollar spent analysis

**Advanced Features**:
- **Statistical Analysis**: Variance, standard deviation, harmonic mean calculations
- **Outlier Detection**: Automatic removal of suspicious or low-quality votes
- **Conflict Resolution**: Real-time resolution of multi-agent disagreements
- **Quality Metrics**: Agreement level, confidence variance, consensus strength, cost efficiency

**Usage**:
```
SuperRez: Run Consensus Analysis
→ Select scenario (Code Review, Architecture Decision, Security Assessment)
→ View consensus results across all 7 algorithms
→ Compare decision quality and cost efficiency

SuperRez: Test Consensus Engine
→ Choose test scenario (High Agreement, Split Decision, Byzantine Fault, Cost Optimization)
→ Detailed consensus analysis with mathematical metrics
→ Individual vote breakdown and alternative options
```

### **👥 Multi-AI Team Simulator (Phase 3)**
**Purpose**: Parallel AI collaboration for complex tasks

**AI Agent Roles**:
- **Security Agent**: Vulnerability analysis specialist
- **Performance Agent**: Optimization expert
- **Frontend Agent**: UI/UX development specialist  
- **Backend Agent**: API and database expert
- **Coordinator Agent**: Task orchestration and consensus

**Team Workflows**:
- **Sequential**: Agents work in order (analysis → implementation → testing)
- **Hierarchical**: Coordinator delegates to specialist agents
- **Consensus**: Agents vote on conflicting recommendations

**Usage**:
```
SuperRez: Create Multi-AI Team
→ Select task type and complexity
→ Choose team composition and workflow
→ Agents collaborate with cost optimization

SuperRez: Show Team Status
→ View agent availability and capabilities
→ CrewAI integration status and metrics
```

---

## 📋 Command Reference

### **Core Session Management**
| Command | Description | Cost |
|---------|-------------|------|
| `SuperRez: Start Session` | Select and start working on a project | FREE |
| `SuperRez: End Session` | Generate AI prompt for progress update | FREE |
| `SuperRez: Show Status` | Display current session and budget info | FREE |
| `SuperRez: Clear Session` | Force clear session without prompts | FREE |
| `SuperRez: Discover Projects` | List all projects with progress files | FREE |

### **Local Analysis (100% FREE)**
| Command | Description | Performance |
|---------|-------------|-------------|
| `SuperRez: Analyze Security` | Comprehensive vulnerability scanning | ~3 seconds for 4,761 files |
| `SuperRez: Analyze Performance` | Performance bottleneck detection | Finds 123+ issues |

### **AI Orchestration**
| Command | Description | Cost Impact |
|---------|-------------|-------------|
| `SuperRez: Show AI Tools` | View available AI tools and status | FREE |
| `SuperRez: Generate Smart Prompt` | Context-aware prompt generation | FREE (reduces AI costs) |
| `SuperRez: Route Task to AI` | Get AI tool recommendations | FREE |

### **Template Engine (NEW)**
| Command | Description | Templates Available |
|---------|-------------|-------------------|
| `SuperRez: Generate From Template` | Create code from templates | 4 built-in + custom |
| `SuperRez: Manage Templates` | Template library management | View, categorize, stats |

### **Advanced Consensus Engine (NEW)**
| Command | Description | Algorithms Available |
|---------|-------------|-------------------|
| `SuperRez: Run Consensus Analysis` | Multi-agent consensus simulation | 7 mathematical methods |
| `SuperRez: Test Consensus Engine` | Test consensus algorithms | 4 comprehensive scenarios |

### **Multi-AI Team**
| Command | Description | Agent Types |
|---------|-------------|-------------|
| `SuperRez: Create Multi-AI Team` | Assemble specialist agents | 5 specialist roles |
| `SuperRez: Show Team Status` | View team and CrewAI status | Integration metrics |

---

## 🏗️ Template Engine Guide

### **Quick Template Generation**
```
1. Start active session: SuperRez: Start Session
2. Generate code: SuperRez: Generate From Template
3. Select template: React Component, Express Route, etc.
4. Enter variables: Component name, route path, etc.
5. Generated code opens in new document
```

### **Available Templates**

#### **React Component Template**
**Use Case**: TypeScript React functional components
**Variables**:
- `componentName` (required): Component name
- `props` (optional): Array of prop definitions

**Generated Code**:
```typescript
import React from 'react';

export interface MyComponentProps {
  title: string;
  count: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  count,
}) => {
  return (
    <div className="my-component">
      <h1>{title}</h1>
      {/* Your component content here */}
    </div>
  );
};

export default MyComponent;
```

#### **Express Route Template**
**Use Case**: Node.js API routes with TypeScript
**Variables**:
- `routePath` (required): API endpoint path
- `hasPost` (optional): Include POST endpoint

**Generated Code**:
```typescript
import { Request, Response, Router } from 'express';

const router = Router();

// GET /api/users
router.get('/api/users', async (req: Request, res: Response) => {
  try {
    // Your implementation here
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### **FastAPI Route Template**
**Use Case**: Python FastAPI endpoints with Pydantic
**Variables**:
- `modelName` (required): Data model name
- `routePath` (required): API endpoint path
- `fields` (optional): Model field definitions

**Generated Code**:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UserRequest(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@router.get("/api/users")
async def get_users():
    """Get all user items"""
    try:
        # Your implementation here
        return {"message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### **Jest Test Template**
**Use Case**: TypeScript test files with proper structure
**Variables**:
- `testTarget` (required): Function/class to test
- `relativePath` (required): Path to test target
- `testDescription` (required): Main test description
- `testCases` (optional): Additional test cases

**Generated Code**:
```typescript
import { validateUser } from '../utils/validation';

describe('validateUser', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should validate user input correctly', async () => {
    // Arrange
    const input = {};
    
    // Act
    const result = await validateUser(input);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### **Pattern Detection Features**

**Automatic Code Style Detection**:
- **Indentation**: Detects spaces vs tabs, 2 vs 4 spaces
- **Quotes**: Single vs double quote preference
- **Semicolons**: Automatic semicolon insertion detection
- **Import Patterns**: Common import statement styles
- **Export Patterns**: export default vs module.exports

**Framework Detection**:
- **React**: Detects React projects for component templates
- **Express**: Node.js API framework detection
- **FastAPI**: Python web framework recognition
- **Next.js**: React framework with SSR/SSG capabilities

### **Custom Template Creation**
```typescript
// Register custom template via API
templateEngine.registerCustomTemplate({
  name: 'my-custom-template',
  description: 'Custom component template',
  category: 'component',
  language: 'typescript',
  framework: 'react',
  template: `/* Your Handlebars template */`,
  variables: [
    { name: 'componentName', type: 'string', required: true }
  ]
});
```

---

## 🤖 AI Tool Integration

### **Tool Detection & Availability**
SuperRez automatically detects installed AI tools:

```bash
# Check AI tool availability
SuperRez: Show AI Tools

# Example output:
✅ Claude Code: Available (Premium analysis)
✅ Ollama: Available (FREE local models)
❌ Gemini CLI: Not installed
✅ GitHub Copilot: Available (Code completion)
❌ Cursor: Not installed
❌ Kimi: Not installed
```

### **Smart Routing Recommendations**

**For Analysis Tasks**:
1. **Ollama** (free) - Privacy-focused, unlimited usage
2. **Claude Code** - Superior reasoning and analysis
3. **Gemini CLI** - Cost-effective general purpose

**For Code Completion**:
1. **GitHub Copilot** - Industry-leading code completion
2. **Cursor** - AI-powered IDE integration
3. **Local models** - Free alternatives

**For Code Generation**:
1. **Ollama** (free) - Unlimited local generation
2. **Template Engine** (FREE) - Pattern-based generation
3. **Gemini CLI** - Cost-effective cloud generation
4. **Claude Code** - Premium quality generation

### **Cost Optimization Strategy**

**Free-First Philosophy**:
```
Priority 1: Local analysis (SuperRez built-in scanners)
Priority 2: Template Engine (pattern-based generation)
Priority 3: Ollama (free local AI models)
Priority 4: Cost-effective paid tools (Gemini CLI)
Priority 5: Premium tools (Claude Code) for complex tasks only
```

**Budget Protection**:
- **Monthly Budget**: Default $50, configurable
- **Cost Warnings**: Before any paid AI calls
- **Usage Tracking**: Real-time budget monitoring
- **95% Cost Reduction**: vs traditional SuperClaude workflow

---

## 💰 Cost Management

### **Budget Configuration**
```json
// VSCode Settings
{
  "superrez.monthlyBudget": 50,           // USD per month
  "superrez.preferredAI": "auto",         // claude-code, gemini-cli, copilot, auto
  "superrez.showCostWarnings": true       // Show warnings before paid calls
}
```

### **Cost Tracking Features**
- **Real-time Monitoring**: Track API usage across all AI tools
- **Budget Warnings**: Alerts at 80% and 100% usage
- **Cost Estimates**: Pre-execution cost calculations
- **Monthly Reports**: Usage breakdown by tool and task type
- **Free Tool Priority**: Automatic routing to minimize costs

### **Cost Comparison**
| Tool/Service | Typical Monthly Cost | SuperRez Cost |
|--------------|---------------------|---------------|
| **SuperClaude Users** | $200-400/month | $0-20/month |
| **Claude Code Direct** | $100-200/month | $10-30/month |
| **Local Analysis** | N/A | **FREE** |
| **Template Generation** | N/A | **FREE** |
| **Ollama Models** | N/A | **FREE** |

**Result**: **95% cost reduction** through local-first architecture

### **Free Usage Maximization**
```
1. Security Analysis: 100% FREE (local scanning)
2. Performance Analysis: 100% FREE (local detection)
3. Template Generation: 100% FREE (pattern-based)
4. Project Discovery: 100% FREE (file system analysis)
5. Session Management: 100% FREE (local context)
6. Ollama Integration: 100% FREE (local AI models)
```

**80% of daily tasks work without any AI API calls**

---

## 🛠️ Troubleshooting

### **Installation Issues**

**Problem**: Extension not appearing in Command Palette
**Solution**:
```
1. Check Extensions list: Ctrl+Shift+X → Search "SuperRez"
2. Restart VSCode: Developer: Reload Window
3. Check status bar for "⚡ SuperRez" indicator
4. Verify activation: Help → Toggle Developer Tools → Console
```

**Problem**: "Cannot find module" errors
**Solution**:
```
1. Ensure dependencies installed: npm install
2. Recompile extension: npm run compile
3. Fresh installation from VSIX package
4. Check Node.js version: node --version (require 16+)
```

### **Session Management Issues**

**Problem**: Sessions not starting
**Solution**:
```
1. Verify project has progress files (progress.md, PROGRESS.md, etc.)
2. Check project discovery: SuperRez: Discover Projects
3. Clear stuck sessions: SuperRez: Clear Session
4. Check file permissions in project directory
```

**Problem**: Progress files not found
**Solution**:
```
1. Create progress.md in project root
2. Add any content to progress file
3. Refresh project discovery
4. Supported files: progress.md, PROGRESS.md, progress_tracking.md
```

### **AI Tool Integration Issues**

**Problem**: AI tools not detected
**Solution**:
```
1. Verify tool installation:
   - claude-code: Check PATH and installation
   - ollama: Run 'ollama list' in terminal
   - gemini-cli: Check installation and auth
2. Restart VSCode after tool installation
3. Check SuperRez: Show AI Tools for status
```

**Problem**: Ollama not working
**Solution**:
```
1. Install Ollama: https://ollama.ai/
2. Pull a model: ollama pull llama2
3. Verify: ollama list
4. Restart VSCode
5. Check SuperRez: Show AI Tools
```

### **Template Engine Issues**

**Problem**: Templates not generating
**Solution**:
```
1. Ensure active session: SuperRez: Start Session
2. Check template availability: SuperRez: Manage Templates
3. Verify project language detection
4. Check template variables are filled correctly
```

**Problem**: Generated code has wrong style
**Solution**:
```
1. Ensure session active for pattern detection
2. Check existing code files in project
3. Template adapts to detected patterns automatically
4. Manually adjust generated code if needed
```

### **Performance Issues**

**Problem**: Analysis taking too long
**Solution**:
```
1. Large projects: Analysis may take 10-30 seconds
2. Check file count: Find output in SuperRez channels
3. Exclude node_modules and build directories
4. Close other extensions during analysis
```

**Problem**: High memory usage
**Solution**:
```
1. Restart VSCode: Developer: Reload Window
2. Close unnecessary projects/files
3. Clear SuperRez sessions: SuperRez: Clear Session
4. Check VSCode memory usage in Task Manager
```

---

## 🔥 Advanced Usage

### **Power User Workflows**

#### **Daily Development Workflow**
```
1. Morning:
   - SuperRez: Start Session → Select active project
   - SuperRez: Analyze Security → Check for new vulnerabilities
   - SuperRez: Show AI Tools → Verify Ollama available for free usage

2. During Development:
   - SuperRez: Generate From Template → Quick component creation
   - SuperRez: Analyze Performance → Optimize bottlenecks
   - SuperRez: Route Task to AI → Get cost-effective recommendations

3. End of Day:
   - SuperRez: End Session → Generate progress summary
   - Use generated prompt with preferred AI tool
   - Update progress.md with AI assistance
```

#### **Multi-Project Management**
```
1. Project Discovery:
   - SuperRez: Discover Projects → See all available projects
   - Organize projects with consistent progress file structure

2. Context Switching:
   - SuperRez: Start Session → Switch between projects instantly
   - Automatic context loading for each project
   - Session-specific budget tracking

3. Cross-Project Analysis:
   - Run security analysis across multiple projects
   - Compare performance patterns between projects
   - Template reuse across different frameworks
```

### **Team Collaboration Features**

#### **Multi-AI Team Coordination**
```
1. Complex Task Breakdown:
   - SuperRez: Create Multi-AI Team
   - Select task type: "Full-stack feature implementation"
   - Choose agents: Frontend + Backend + Security

2. Agent Specialization:
   - Security Agent: Focus on vulnerability analysis
   - Performance Agent: Optimize code efficiency
   - Frontend Agent: UI/UX implementation
   - Backend Agent: API and database design
   - Coordinator: Task orchestration and consensus

3. Consensus Mechanisms:
   - Agents vote on conflicting recommendations
   - Confidence scoring for decisions
   - Automatic conflict resolution
```

#### **Cost-Optimized Team Workflows**
```
1. Local-First Analysis:
   - Security + Performance agents use FREE local scanners
   - Only use paid AI for complex reasoning tasks
   - Template generation reduces token usage

2. Smart AI Routing:
   - Frontend Agent → Ollama (free) for UI generation
   - Backend Agent → Gemini CLI (cost-effective) for APIs
   - Security Agent → Built-in scanners (FREE) + Claude Code backup

3. Budget Distribution:
   - Allocate budget across agent types
   - Prioritize free tools for routine tasks
   - Reserve premium AI for complex decisions
```

### **Custom Template Development**

#### **Creating Project-Specific Templates**
```typescript
// Example: Custom Vue.js component template
const vueTemplate = {
  name: 'vue-component',
  description: 'Vue.js component with TypeScript',
  category: 'component',
  language: 'typescript',
  framework: 'vue',
  template: `
<template>
  <div class="{{kebabCase componentName}}">
    <h1>{{ title }}</h1>
    <!-- Your component content -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<style scoped>
.{{kebabCase componentName}} {
  /* Your styles */
}
</style>
  `,
  variables: [
    { name: 'componentName', type: 'string', required: true },
    { name: 'title', type: 'string', required: false, defaultValue: 'Component Title' }
  ]
};

// Register via extension API
templateEngine.registerCustomTemplate(vueTemplate);
```

#### **Template Pattern Adaptation**
```
1. Pattern Detection:
   - Indentation: Auto-detects 2 vs 4 spaces, tabs
   - Quotes: Single vs double quote analysis
   - Imports: Analyze common import patterns
   - Exports: Default vs named export preferences

2. Framework Integration:
   - React: JSX patterns, hook usage, prop types
   - Express: Middleware patterns, error handling
   - FastAPI: Pydantic models, async patterns
   - Vue: Composition API, template structure

3. Project Context:
   - Existing file structure analysis
   - Naming convention detection
   - Architecture pattern recognition
```

### **Integration with External Tools**

#### **GitHub Actions Integration**
```yaml
# .github/workflows/superrez-analysis.yml
name: SuperRez Analysis
on: [push, pull_request]

jobs:
  security-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run SuperRez Security Analysis
        run: |
          # Install SuperRez CLI (when available)
          superrez analyze security --output=json
          superrez analyze performance --output=json
```

#### **CI/CD Pipeline Integration**
```bash
# Example CI script
#!/bin/bash
echo "Running SuperRez Analysis..."

# Security Analysis
vscode --install-extension superrez-0.1.0.vsix
vscode --run-script "SuperRez: Analyze Security"

# Performance Analysis  
vscode --run-script "SuperRez: Analyze Performance"

# Template Generation for tests
vscode --run-script "SuperRez: Generate From Template" --template=jest-test

echo "SuperRez analysis complete"
```

---

## 🔧 Development Reference

### **Extension Architecture**

#### **Core Components**
```typescript
// Main extension components
SessionManager      // Project discovery and context management
SecurityScanner     // Local vulnerability detection engine
PerformanceAnalyzer // Local performance pattern analysis
AIOrchestrator      // Multi-AI tool detection and routing
CostTracker         // Budget management and cost optimization
ProjectDiscovery    // Intelligent project detection
TemplateEngine      // Template-based code generation (Phase 4.1)
CrewAIIntegration   // Multi-agent team orchestration
```

#### **File Structure**
```
src/
├── extension.ts           # Main extension entry point
├── sessionManager.ts      # Session and project management
├── securityScanner.ts     # Local security analysis
├── performanceAnalyzer.ts # Local performance analysis
├── aiOrchestrator.ts      # AI tool detection and routing
├── costTracker.ts         # Budget management
├── projectDiscovery.ts    # Project discovery engine
├── templateEngine.ts      # Template-based code generation
└── crewAIIntegration.ts   # Multi-agent team orchestration
```

### **Extension Configuration**
```json
{
  "superrez.monthlyBudget": {
    "type": "number",
    "default": 50,
    "description": "Monthly budget for AI API calls in USD"
  },
  "superrez.preferredAI": {
    "type": "string",
    "enum": ["claude-code", "gemini-cli", "copilot", "auto"],
    "default": "auto",
    "description": "Preferred AI tool for tasks"
  },
  "superrez.showCostWarnings": {
    "type": "boolean",
    "default": true,
    "description": "Show cost warnings before AI API calls"
  }
}
```

### **Development Commands**
```bash
# Development
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
vsce package         # Create VSIX package

# Testing
F5                   # Launch Extension Development Host
Ctrl+R              # Reload extension in dev host
Ctrl+Shift+I        # Open Developer Tools
```

### **API Reference**

#### **SessionManager API**
```typescript
interface SessionManager {
  startSession(project: Project): Promise<void>;
  endSession(): Promise<string | null>;
  getActiveSession(): SessionData | null;
  cleanup(): Promise<void>;
}
```

#### **TemplateEngine API**
```typescript
interface TemplateEngine {
  generateFromTemplate(templateName: string, context?: Record<string, any>): Promise<string>;
  registerCustomTemplate(template: Template): void;
  getAvailableTemplates(): Template[];
  getTemplatesByCategory(category: TemplateCategory): Template[];
  analyzeCodePatterns(projectPath: string): Promise<CodePatterns>;
}
```

#### **AIOrchestrator API**
```typescript
interface AIOrchestrator {
  detectAvailableTools(): Promise<AITool[]>;
  routeTaskToOptimalTool(taskType: TaskType): Promise<AITool>;
  generateSmartPrompt(context: any): Promise<string>;
  estimateCost(prompt: string, tool: AITool): Promise<number>;
}
```

### **Contributing Guidelines**

#### **Development Setup**
```bash
1. Fork repository: https://github.com/rezurx/SuperRez
2. Clone your fork: git clone <your-fork-url>
3. Install dependencies: npm install
4. Create feature branch: git checkout -b feature/your-feature
5. Make changes and test thoroughly
6. Submit pull request with detailed description
```

#### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Testing**: Add tests for new features
- **Documentation**: Update user manual for user-facing changes
- **Commit Messages**: Use conventional commit format

#### **Testing Checklist**
```
□ Extension loads without errors
□ All commands appear in Command Palette
□ Session management works correctly
□ Security analysis completes successfully
□ Performance analysis finds issues
□ Template generation works for all built-in templates
□ AI tool detection functions properly
□ Cost tracking updates correctly
□ Status bar shows correct information
□ Error handling works gracefully
```

---

## 📞 Support & Community

### **Getting Help**
- **GitHub Issues**: https://github.com/rezurx/SuperRez/issues
- **Discussions**: GitHub Discussions for questions and ideas
- **Documentation**: This manual and README.md
- **Discord**: #superrez channel (automated updates)

### **Feature Requests**
Use GitHub Issues with:
- **Clear description** of the feature
- **Use case explanation** 
- **Expected behavior**
- **Alternative solutions** considered

### **Bug Reports**
Include:
- **VSCode version**
- **SuperRez version**
- **Operating system**
- **Reproduction steps**
- **Expected vs actual behavior**
- **Console errors** (if any)

### **Contributing**
See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**SuperRez**: From local-first to multi-AI first - revolutionizing development productivity.

**Repository**: https://github.com/rezurx/SuperRez  
**License**: MIT  
**Version**: 0.2.0 (Phase 4.4 - Kimi K2 Integration)