import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PerformanceIssue {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    description: string;
    file: string;
    line: number;
    code: string;
    suggestion: string;
}

export interface PerformanceResults {
    timestamp: string;
    issues: PerformanceIssue[];
    metrics: {
        totalFiles: number;
        linesAnalyzed: number;
        issuesFound: number;
        severityBreakdown: { [key: string]: number };
    };
}

export class PerformanceAnalyzer {
    async analyze(projectPath: string): Promise<PerformanceResults> {
        const results: PerformanceResults = {
            timestamp: new Date().toISOString(),
            issues: [],
            metrics: {
                totalFiles: 0,
                linesAnalyzed: 0,
                issuesFound: 0,
                severityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 }
            }
        };

        try {
            // Find all relevant files
            const command = `find "${projectPath}" -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" -o -name "*.php" -o -name "*.rb" -o -name "*.sol" \\) -not -path "*/node_modules/*" -not -path "*/.*" -not -path "*/dist/*" -not -path "*/build/*" 2>/dev/null`;
            const { stdout } = await execAsync(command);
            
            const files = stdout.trim().split('\n').filter(f => f.length > 0);
            results.metrics.totalFiles = files.length;

            // Analyze each file
            for (const file of files) {
                const fileIssues = await this.analyzeFile(file);
                results.issues.push(...fileIssues);
                
                // Count lines in file
                try {
                    const content = await fs.promises.readFile(file, 'utf8');
                    results.metrics.linesAnalyzed += content.split('\n').length;
                } catch {
                    // Skip if file can't be read
                }
            }

            // Update metrics
            results.metrics.issuesFound = results.issues.length;
            results.issues.forEach(issue => {
                results.metrics.severityBreakdown[issue.severity]++;
            });

        } catch (error) {
            console.error('Performance analysis error:', error);
        }

        return results;
    }

    private async analyzeFile(filePath: string): Promise<PerformanceIssue[]> {
        const issues: PerformanceIssue[] = [];
        
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;
                
                // Check for various performance issues
                const algorithmIssues = this.checkAlgorithmicComplexity(line, filePath, lineNumber);
                issues.push(...algorithmIssues);
                
                const memoryIssues = this.checkMemoryUsage(line, filePath, lineNumber);
                issues.push(...memoryIssues);
                
                const asyncIssues = this.checkAsyncPatterns(line, filePath, lineNumber);
                issues.push(...asyncIssues);
                
                const databaseIssues = this.checkDatabaseQueries(line, filePath, lineNumber);
                issues.push(...databaseIssues);
                
                const networkIssues = this.checkNetworkRequests(line, filePath, lineNumber);
                issues.push(...networkIssues);
                
                const renderingIssues = this.checkRenderingPatterns(line, filePath, lineNumber);
                issues.push(...renderingIssues);
            }
            
        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
        }
        
        return issues;
    }

    private checkAlgorithmicComplexity(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        const patterns = [
            {
                pattern: /for\s*\([^)]*\)\s*{\s*for\s*\([^)]*\)\s*{/,
                severity: 'HIGH' as const,
                description: 'Nested loops detected - O(n²) complexity',
                suggestion: 'Consider using maps, sets, or more efficient algorithms'
            },
            {
                pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)\s*{/,
                severity: 'HIGH' as const,
                description: 'Triple nested loops - O(n³) complexity',
                suggestion: 'Refactor to reduce algorithmic complexity'
            },
            {
                pattern: /\.find\s*\([^)]*\)\s*\.find\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'Chained array.find() calls - inefficient',
                suggestion: 'Consider using a single loop or Map for lookups'
            },
            {
                pattern: /\.filter\s*\([^)]*\)\s*\.filter\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'Chained array.filter() calls',
                suggestion: 'Combine filters into a single operation'
            },
            {
                pattern: /\.indexOf\s*\([^)]*\)\s*!=\s*-1/,
                severity: 'LOW' as const,
                description: 'Using indexOf instead of includes()',
                suggestion: 'Use array.includes() for better readability'
            },
            {
                pattern: /Object\.keys\s*\([^)]*\)\.length/,
                severity: 'LOW' as const,
                description: 'Inefficient object length check',
                suggestion: 'Consider using Object.keys().length or a size property'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Algorithmic Complexity',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    private checkMemoryUsage(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        const patterns = [
            {
                pattern: /new\s+Array\s*\(\s*\d+\s*\)/,
                severity: 'MEDIUM' as const,
                description: 'Large array pre-allocation',
                suggestion: 'Consider lazy initialization or streaming'
            },
            {
                pattern: /\.map\s*\([^)]*\)\s*\.map\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'Chained array.map() creates intermediate arrays',
                suggestion: 'Combine operations or use generators'
            },
            {
                pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
                severity: 'HIGH' as const,
                description: 'Deep cloning with JSON - memory intensive',
                suggestion: 'Use a proper deep clone library or structured cloning'
            },
            {
                pattern: /setInterval\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'setInterval without cleanup',
                suggestion: 'Ensure clearInterval is called to prevent memory leaks'
            },
            {
                pattern: /addEventListener\s*\(/,
                severity: 'LOW' as const,
                description: 'Event listener added',
                suggestion: 'Ensure removeEventListener is called to prevent memory leaks'
            },
            {
                pattern: /global\s*\[|window\s*\[/,
                severity: 'MEDIUM' as const,
                description: 'Global variable access',
                suggestion: 'Minimize global scope usage'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Memory Usage',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    private checkAsyncPatterns(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        const patterns = [
            {
                pattern: /await\s+.*await\s+/,
                severity: 'MEDIUM' as const,
                description: 'Sequential awaits - could be parallelized',
                suggestion: 'Use Promise.all() or Promise.allSettled() for parallel execution'
            },
            {
                pattern: /for\s*\([^)]*\)\s*{[^}]*await\s+/,
                severity: 'HIGH' as const,
                description: 'Async operation in loop - sequential execution',
                suggestion: 'Use Promise.all() with map() for parallel processing'
            },
            {
                pattern: /new\s+Promise\s*\(\s*\(\s*resolve\s*,\s*reject\s*\)\s*=>\s*{/,
                severity: 'LOW' as const,
                description: 'Manual Promise constructor',
                suggestion: 'Consider using async/await or existing Promise methods'
            },
            {
                pattern: /\.then\s*\([^)]*\)\s*\.then\s*\(/,
                severity: 'LOW' as const,
                description: 'Promise chain',
                suggestion: 'Consider using async/await for better readability'
            },
            {
                pattern: /setTimeout\s*\(\s*.*\s*,\s*0\s*\)/,
                severity: 'MEDIUM' as const,
                description: 'setTimeout with 0 delay',
                suggestion: 'Use queueMicrotask() or proper async patterns'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Async Patterns',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    private checkDatabaseQueries(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        const patterns = [
            {
                pattern: /SELECT\s+\*\s+FROM/i,
                severity: 'HIGH' as const,
                description: 'SELECT * query - fetches all columns',
                suggestion: 'Specify only needed columns'
            },
            {
                pattern: /for\s*\([^)]*\)\s*{[^}]*\.(query|execute)\s*\(/,
                severity: 'HIGH' as const,
                description: 'Database query in loop - N+1 problem',
                suggestion: 'Use batch queries or JOIN statements'
            },
            {
                pattern: /\.findAll\s*\(\s*\)/,
                severity: 'MEDIUM' as const,
                description: 'Fetching all records without limit',
                suggestion: 'Add pagination or limit clauses'
            },
            {
                pattern: /ORDER\s+BY\s+[^L]*$/i,
                severity: 'MEDIUM' as const,
                description: 'ORDER BY without LIMIT',
                suggestion: 'Consider adding LIMIT for large datasets'
            },
            {
                pattern: /LIKE\s+['"]%.*%['"]/i,
                severity: 'MEDIUM' as const,
                description: 'LIKE with leading wildcard',
                suggestion: 'Use full-text search or index optimization'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Database Queries',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    private checkNetworkRequests(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        const patterns = [
            {
                pattern: /fetch\s*\([^)]*\)\s*\.then\s*\([^)]*\)\s*\.then\s*\(/,
                severity: 'LOW' as const,
                description: 'Fetch with promise chain',
                suggestion: 'Consider using async/await for better error handling'
            },
            {
                pattern: /for\s*\([^)]*\)\s*{[^}]*fetch\s*\(/,
                severity: 'HIGH' as const,
                description: 'Network requests in loop - sequential execution',
                suggestion: 'Use Promise.all() for parallel requests'
            },
            {
                pattern: /axios\.get\s*\([^)]*\)\s*\.then/,
                severity: 'LOW' as const,
                description: 'Axios with .then()',
                suggestion: 'Use async/await with try/catch'
            },
            {
                pattern: /setInterval\s*\([^)]*fetch\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'Polling with setInterval',
                suggestion: 'Consider WebSockets or Server-Sent Events'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Network Requests',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    private checkRenderingPatterns(line: string, file: string, lineNumber: number): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        
        // Only check React/JS files
        if (!file.includes('.js') && !file.includes('.ts') && !file.includes('.jsx') && !file.includes('.tsx')) {
            return issues;
        }
        
        const patterns = [
            {
                pattern: /\.map\s*\([^)]*\)\s*\.map\s*\(/,
                severity: 'MEDIUM' as const,
                description: 'Chained map in render',
                suggestion: 'Combine operations or memoize intermediate results'
            },
            {
                pattern: /useEffect\s*\([^)]*\)\s*$/,
                severity: 'MEDIUM' as const,
                description: 'useEffect without dependencies',
                suggestion: 'Add dependency array to prevent infinite re-renders'
            },
            {
                pattern: /onClick\s*=\s*{\s*\(\s*\)\s*=>/,
                severity: 'LOW' as const,
                description: 'Inline arrow function in onClick',
                suggestion: 'Use useCallback or define function outside render'
            },
            {
                pattern: /style\s*=\s*{\s*{/,
                severity: 'LOW' as const,
                description: 'Inline style object',
                suggestion: 'Define styles outside render or use CSS classes'
            },
            {
                pattern: /key\s*=\s*{index}/,
                severity: 'MEDIUM' as const,
                description: 'Using array index as key',
                suggestion: 'Use unique, stable identifiers as keys'
            }
        ];

        for (const { pattern, severity, description, suggestion } of patterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity,
                    category: 'Rendering Performance',
                    description,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim(),
                    suggestion
                });
            }
        }

        return issues;
    }

    generateReport(results: PerformanceResults): string {
        const { issues, metrics } = results;
        
        const severityColors = {
            HIGH: '🔴',
            MEDIUM: '🟡',
            LOW: '🟢'
        };

        const categoryBreakdown = issues.reduce((acc, issue) => {
            acc[issue.category] = (acc[issue.category] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        return `# Performance Analysis Report

**Generated**: ${new Date(results.timestamp).toLocaleString()}

## Summary
- **Files Analyzed**: ${metrics.totalFiles}
- **Lines Analyzed**: ${metrics.linesAnalyzed.toLocaleString()}
- **Issues Found**: ${metrics.issuesFound}

## Severity Breakdown
${Object.entries(metrics.severityBreakdown)
    .map(([severity, count]) => `- ${severityColors[severity as keyof typeof severityColors]} **${severity}**: ${count}`)
    .join('\n')}

## Category Breakdown
${Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .map(([category, count]) => `- **${category}**: ${count} issues`)
    .join('\n')}

## Detailed Issues

${issues.slice(0, 20).map((issue, i) => `
### ${i + 1}. ${severityColors[issue.severity]} ${issue.severity} - ${issue.category}

**File**: ${issue.file}:${issue.line}
**Issue**: ${issue.description}
**Suggestion**: ${issue.suggestion}

\`\`\`
${issue.code}
\`\`\`
`).join('\n')}

${issues.length > 20 ? `\n*... and ${issues.length - 20} more issues*` : ''}

## Performance Recommendations

### High Priority
1. **Optimize Algorithm Complexity**: Focus on nested loops and O(n²) operations
2. **Fix Database N+1 Problems**: Batch queries and use JOINs
3. **Parallelize Async Operations**: Use Promise.all() instead of sequential awaits

### Medium Priority
1. **Reduce Memory Usage**: Minimize object creation and clean up event listeners
2. **Optimize Rendering**: Use React.memo, useCallback, and proper keys
3. **Improve Database Queries**: Add indexes and use specific column selection

### Low Priority
1. **Code Quality**: Use modern JavaScript features and best practices
2. **Maintainability**: Improve async/await usage and error handling

## Cost-Free Analysis
This performance analysis was completed locally without any API costs. For deeper analysis, consider using SuperRez's AI orchestrator to route specific performance questions to the most appropriate AI tool.`;
    }
}