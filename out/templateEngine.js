"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateEngine = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const Handlebars = require("handlebars");
class TemplateEngine {
    constructor(sessionManager, aiOrchestrator) {
        this.sessionManager = sessionManager;
        this.aiOrchestrator = aiOrchestrator;
        this.templates = new Map();
        this.outputChannel = vscode.window.createOutputChannel('SuperRez Template Engine');
        this.initializeBuiltInTemplates();
        this.registerHandlebarsHelpers();
    }
    async generateFromTemplate(templateName, customContext) {
        try {
            const template = this.templates.get(templateName);
            if (!template) {
                throw new Error(`Template '${templateName}' not found`);
            }
            const context = await this.buildTemplateContext(customContext);
            const compiledTemplate = Handlebars.compile(template.template);
            const result = compiledTemplate(context);
            this.outputChannel.appendLine(`Generated code from template: ${templateName}`);
            return result;
        }
        catch (error) {
            this.outputChannel.appendLine(`Error generating from template: ${error}`);
            throw error;
        }
    }
    async analyzeCodePatterns(projectPath) {
        const patterns = {
            imports: [],
            exportPattern: 'export default',
            functionPattern: 'function',
            classPattern: 'class',
            indentation: '  ',
            quotes: 'single',
            semicolons: true
        };
        try {
            // Analyze TypeScript/JavaScript files
            const files = await this.findCodeFiles(projectPath, ['.ts', '.js', '.tsx', '.jsx']);
            if (files.length > 0) {
                const sampleFile = fs.readFileSync(files[0], 'utf8');
                // Detect indentation
                const indentMatch = sampleFile.match(/^(\s+)/m);
                if (indentMatch) {
                    patterns.indentation = indentMatch[1];
                }
                // Detect quotes
                const singleQuotes = (sampleFile.match(/'/g) || []).length;
                const doubleQuotes = (sampleFile.match(/"/g) || []).length;
                patterns.quotes = singleQuotes > doubleQuotes ? 'single' : 'double';
                // Detect semicolons
                const semicolonLines = sampleFile.split('\n').filter(line => line.trim().endsWith(';'));
                patterns.semicolons = semicolonLines.length > files.length * 0.5;
                // Detect common imports
                const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
                let match;
                while ((match = importRegex.exec(sampleFile)) !== null) {
                    patterns.imports.push(match[1]);
                }
                // Detect export pattern
                if (sampleFile.includes('export default')) {
                    patterns.exportPattern = 'export default';
                }
                else if (sampleFile.includes('module.exports')) {
                    patterns.exportPattern = 'module.exports';
                }
            }
        }
        catch (error) {
            this.outputChannel.appendLine(`Error analyzing patterns: ${error}`);
        }
        return patterns;
    }
    registerCustomTemplate(template) {
        this.templates.set(template.name, template);
        this.outputChannel.appendLine(`Registered custom template: ${template.name}`);
    }
    getAvailableTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplatesByCategory(category) {
        return Array.from(this.templates.values()).filter(t => t.category === category);
    }
    async buildTemplateContext(customVariables) {
        const session = this.sessionManager.getActiveSession();
        if (!session) {
            throw new Error('No active session. Please start a session first.');
        }
        const patterns = await this.analyzeCodePatterns(session.path);
        return {
            projectName: session.name,
            projectPath: session.path,
            language: this.detectProjectLanguage(session.path),
            framework: this.detectFramework(session.path),
            patterns,
            customVariables: customVariables || {}
        };
    }
    detectProjectLanguage(projectPath) {
        if (fs.existsSync(path.join(projectPath, 'package.json'))) {
            return 'typescript';
        }
        if (fs.existsSync(path.join(projectPath, 'requirements.txt')) || fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
            return 'python';
        }
        if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
            return 'go';
        }
        if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
            return 'rust';
        }
        return 'unknown';
    }
    detectFramework(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.react)
                    return 'react';
                if (deps.vue)
                    return 'vue';
                if (deps.angular)
                    return 'angular';
                if (deps.express)
                    return 'express';
                if (deps.fastify)
                    return 'fastify';
                if (deps.next)
                    return 'nextjs';
            }
        }
        catch (error) {
            // Ignore errors
        }
        return undefined;
    }
    async findCodeFiles(projectPath, extensions) {
        const files = [];
        const walkDir = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules')
                        continue;
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walkDir(fullPath);
                    }
                    else if (extensions.some(ext => fullPath.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Ignore errors for inaccessible directories
            }
        };
        walkDir(projectPath);
        return files.slice(0, 10); // Limit to first 10 files for performance
    }
    registerHandlebarsHelpers() {
        // Helper for proper casing
        Handlebars.registerHelper('pascalCase', function (str) {
            return str.replace(/(?:^|\s)\w/g, match => match.toUpperCase()).replace(/\s/g, '');
        });
        Handlebars.registerHelper('camelCase', function (str) {
            const pascal = str.replace(/(?:^|\s)\w/g, match => match.toUpperCase()).replace(/\s/g, '');
            return pascal.charAt(0).toLowerCase() + pascal.slice(1);
        });
        Handlebars.registerHelper('kebabCase', function (str) {
            return str.toLowerCase().replace(/\s/g, '-');
        });
        // Helper for conditional imports
        Handlebars.registerHelper('needsImport', function (framework, importName) {
            const frameworkImports = {
                'react': ['React', 'useState', 'useEffect', 'useCallback'],
                'express': ['express', 'Request', 'Response'],
                'fastapi': ['FastAPI', 'Depends']
            };
            return frameworkImports[framework]?.includes(importName) || false;
        });
    }
    initializeBuiltInTemplates() {
        // React Component Template
        this.templates.set('react-component', {
            name: 'react-component',
            description: 'React functional component with TypeScript',
            category: 'component',
            language: 'typescript',
            framework: 'react',
            template: `import React from 'react';

export interface {{pascalCase componentName}}Props {
  {{#each props}}
  {{name}}: {{type}};
  {{/each}}
}

export const {{pascalCase componentName}}: React.FC<{{pascalCase componentName}}Props> = ({{#if props}}{
  {{#each props}}{{name}},{{/each}}
}{{/if}}) => {
  return (
    <div className="{{kebabCase componentName}}">
      <h1>{{componentName}}</h1>
      {/* Your component content here */}
    </div>
  );
};

export default {{pascalCase componentName}};
`,
            variables: [
                { name: 'componentName', type: 'string', description: 'Name of the component', required: true },
                { name: 'props', type: 'array', description: 'Component props', required: false, defaultValue: [] }
            ]
        });
        // Express API Route Template
        this.templates.set('express-route', {
            name: 'express-route',
            description: 'Express.js API route with TypeScript',
            category: 'api',
            language: 'typescript',
            framework: 'express',
            template: `import { Request, Response, Router } from 'express';

const router = Router();

// GET {{routePath}}
router.get('{{routePath}}', async (req: Request, res: Response) => {
  try {
    // Your implementation here
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

{{#if hasPost}}
// POST {{routePath}}
router.post('{{routePath}}', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // Your implementation here
    res.status(201).json({ message: 'Created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
{{/if}}

export default router;
`,
            variables: [
                { name: 'routePath', type: 'string', description: 'API route path', required: true },
                { name: 'hasPost', type: 'boolean', description: 'Include POST endpoint', required: false, defaultValue: false }
            ]
        });
        // Python FastAPI Route Template
        this.templates.set('fastapi-route', {
            name: 'fastapi-route',
            description: 'FastAPI route with Pydantic models',
            category: 'api',
            language: 'python',
            framework: 'fastapi',
            template: `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class {{pascalCase modelName}}Request(BaseModel):
    {{#each fields}}
    {{name}}: {{type}}
    {{/each}}

class {{pascalCase modelName}}Response(BaseModel):
    id: int
    {{#each fields}}
    {{name}}: {{type}}
    {{/each}}

@router.get("{{routePath}}")
async def get_{{camelCase modelName}}s():
    """Get all {{modelName}} items"""
    try:
        # Your implementation here
        return {"message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("{{routePath}}", response_model={{pascalCase modelName}}Response)
async def create_{{camelCase modelName}}(item: {{pascalCase modelName}}Request):
    """Create a new {{modelName}}"""
    try:
        # Your implementation here
        return item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`,
            variables: [
                { name: 'modelName', type: 'string', description: 'Model name', required: true },
                { name: 'routePath', type: 'string', description: 'API route path', required: true },
                { name: 'fields', type: 'array', description: 'Model fields', required: false, defaultValue: [] }
            ]
        });
        // Jest Test Template
        this.templates.set('jest-test', {
            name: 'jest-test',
            description: 'Jest test file with TypeScript',
            category: 'test',
            language: 'typescript',
            template: `import { {{testTarget}} } from '../{{relativePath}}';

describe('{{testTarget}}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should {{testDescription}}', async () => {
    // Arrange
    const input = {};
    
    // Act
    const result = await {{testTarget}}(input);
    
    // Assert
    expect(result).toBeDefined();
  });

  {{#each testCases}}
  it('should {{description}}', async () => {
    // Your test implementation
    expect(true).toBe(true);
  });

  {{/each}}
});
`,
            variables: [
                { name: 'testTarget', type: 'string', description: 'Function/class to test', required: true },
                { name: 'relativePath', type: 'string', description: 'Relative path to test target', required: true },
                { name: 'testDescription', type: 'string', description: 'Main test description', required: true },
                { name: 'testCases', type: 'array', description: 'Additional test cases', required: false, defaultValue: [] }
            ]
        });
        this.outputChannel.appendLine('Initialized built-in templates');
    }
}
exports.TemplateEngine = TemplateEngine;
//# sourceMappingURL=templateEngine.js.map