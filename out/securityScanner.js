"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityScanner = void 0;
const fs = require("fs");
const path = require("path");
function findFiles(dir, pattern) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findFiles(fullPath, pattern));
        }
        else if (pattern.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}
class SecurityScanner {
    async scan(projectPath) {
        const results = {
            timestamp: new Date().toISOString(),
            issues: []
        };
        try {
            // Find all relevant files
            const filePattern = /\.(js|ts|jsx|tsx|py|php|java|rb|go|rs|sol)$/;
            const files = findFiles(projectPath, filePattern)
                .filter(file => !file.includes('node_modules') &&
                !file.includes('/.') &&
                !file.includes('/dist/') &&
                !file.includes('/build/'));
            // Scan each file
            for (const file of files) {
                const fileIssues = await this.scanFile(file);
                results.issues.push(...fileIssues);
            }
        }
        catch (error) {
            console.error('Security scan error:', error);
        }
        return results;
    }
    async scanFile(filePath) {
        const issues = [];
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;
                // Check for hardcoded secrets
                const secretIssues = this.checkSecrets(line, filePath, lineNumber);
                issues.push(...secretIssues);
                // Check for SQL injection
                const sqlIssues = this.checkSQLInjection(line, filePath, lineNumber);
                issues.push(...sqlIssues);
                // Check for XSS vulnerabilities
                const xssIssues = this.checkXSS(line, filePath, lineNumber);
                issues.push(...xssIssues);
                // Check for weak cryptography
                const cryptoIssues = this.checkWeakCrypto(line, filePath, lineNumber);
                issues.push(...cryptoIssues);
                // Check for path traversal
                const pathIssues = this.checkPathTraversal(line, filePath, lineNumber);
                issues.push(...pathIssues);
            }
        }
        catch (error) {
            console.error(`Error scanning file ${filePath}:`, error);
        }
        return issues;
    }
    checkSecrets(line, file, lineNumber) {
        const issues = [];
        const secretPatterns = [
            { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["\']([^"\']{20,})["\']/, desc: 'API Key' },
            { pattern: /(?:secret[_-]?key|secretkey)\s*[:=]\s*["\']([^"\']{20,})["\']/, desc: 'Secret Key' },
            { pattern: /(?:password|pwd|pass)\s*[:=]\s*["\']([^"\']{8,})["\']/, desc: 'Password' },
            { pattern: /(?:token|auth[_-]?token)\s*[:=]\s*["\']([^"\']{20,})["\']/, desc: 'Auth Token' },
            { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, desc: 'Private Key' },
            { pattern: /sk-[a-zA-Z0-9]{48}/, desc: 'OpenAI API Key' },
            { pattern: /AIza[0-9A-Za-z\\-_]{35}/, desc: 'Google API Key' },
            { pattern: /AKIA[0-9A-Z]{16}/, desc: 'AWS Access Key' }
        ];
        for (const { pattern, desc } of secretPatterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity: 'HIGH',
                    category: 'Hardcoded Secrets',
                    description: `Potential hardcoded ${desc} found`,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim()
                });
            }
        }
        return issues;
    }
    checkSQLInjection(line, file, lineNumber) {
        const issues = [];
        const sqlPatterns = [
            /query\s*\(\s*["\'].*\+.*["\']/,
            /execute\s*\(\s*["\'].*\+.*["\']/,
            /(?:SELECT|INSERT|UPDATE|DELETE).*\+.*(?:WHERE|VALUES|SET)/,
            /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/,
            /f["'].*(?:SELECT|INSERT|UPDATE|DELETE).*\{.*\}/ // f-strings in SQL
        ];
        for (const pattern of sqlPatterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity: 'HIGH',
                    category: 'SQL Injection',
                    description: 'Potential SQL injection vulnerability - use parameterized queries',
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim()
                });
            }
        }
        return issues;
    }
    checkXSS(line, file, lineNumber) {
        const issues = [];
        const xssPatterns = [
            /\.innerHTML\s*=\s*(?!["'])/,
            /\.outerHTML\s*=\s*(?!["'])/,
            /eval\s*\(/,
            /document\.write\s*\(/,
            /dangerouslySetInnerHTML/,
            /\$\{.*\}.*<script/,
            /\+.*<script/ // String concatenation with script tags
        ];
        for (const pattern of xssPatterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity: 'HIGH',
                    category: 'XSS Vulnerability',
                    description: 'Potential XSS vulnerability - sanitize user input',
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim()
                });
            }
        }
        return issues;
    }
    checkWeakCrypto(line, file, lineNumber) {
        const issues = [];
        const weakCryptoPatterns = [
            { pattern: /\bMD5\b/, desc: 'MD5 hash algorithm' },
            { pattern: /\bSHA1\b/, desc: 'SHA1 hash algorithm' },
            { pattern: /Math\.random\(\)/, desc: 'Math.random() for cryptographic purposes' },
            { pattern: /\bDES\b/, desc: 'DES encryption' },
            { pattern: /\bRC4\b/, desc: 'RC4 encryption' }
        ];
        for (const { pattern, desc } of weakCryptoPatterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity: 'MEDIUM',
                    category: 'Weak Cryptography',
                    description: `Weak cryptographic algorithm detected: ${desc}`,
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim()
                });
            }
        }
        return issues;
    }
    checkPathTraversal(line, file, lineNumber) {
        const issues = [];
        const pathTraversalPatterns = [
            /\.\.[\/\\]/,
            /readFile\s*\([^)]*\+/,
            /writeFile\s*\([^)]*\+/,
            /\$\{.*\}.*[\/\\]/,
            /\/\*.*\*\// // Path wildcards
        ];
        for (const pattern of pathTraversalPatterns) {
            if (pattern.test(line)) {
                issues.push({
                    severity: 'MEDIUM',
                    category: 'Path Traversal',
                    description: 'Potential path traversal vulnerability - validate file paths',
                    file: path.basename(file),
                    line: lineNumber,
                    code: line.trim()
                });
            }
        }
        return issues;
    }
}
exports.SecurityScanner = SecurityScanner;
//# sourceMappingURL=securityScanner.js.map