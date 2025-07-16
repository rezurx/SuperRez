"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDiscovery = void 0;
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ProjectDiscovery {
    async findProjects() {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const projects = [];
        try {
            // Use the same command as the bash script
            const command = `find ~ -iname "*progress*.md" -type f -not -path "*/node_modules/*" -not -path "*/.*" 2>/dev/null`;
            const { stdout } = await execAsync(command);
            const files = stdout.trim().split('\n').filter(f => f.length > 0);
            for (const progressFile of files) {
                const projectDir = path.dirname(progressFile);
                const projectName = path.basename(projectDir);
                const progressFileName = path.basename(progressFile);
                // Skip files that are not actually progress files
                if (progressFileName.includes('paradox-of-progress') ||
                    progressFileName === 'SUPERREZ_PROGRESS.md' ||
                    progressFileName.includes('external-articles')) {
                    continue;
                }
                // Verify the file exists and is readable
                try {
                    await fs.promises.access(progressFile, fs.constants.R_OK);
                    projects.push({
                        name: projectName,
                        path: projectDir,
                        progressFile: progressFileName
                    });
                }
                catch {
                    // File not readable, skip
                }
            }
            // Sort by project name
            projects.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (error) {
            console.error('Error discovering projects:', error);
        }
        return projects;
    }
    async validateProject(projectPath) {
        try {
            const patterns = [
                'progress.md',
                'PROGRESS.md',
                'Progress.md',
                'progress_*.md',
                'PROGRESS_*.md'
            ];
            const command = `find "${projectPath}" -maxdepth 1 -iname "*progress*.md" -type f 2>/dev/null`;
            const { stdout } = await execAsync(command);
            return stdout.trim().length > 0;
        }
        catch {
            return false;
        }
    }
    async findProgressFile(projectPath) {
        try {
            const patterns = [
                'progress.md',
                'PROGRESS.md',
                'Progress.md',
                'progress_*.md',
                'PROGRESS_*.md'
            ];
            const command = `find "${projectPath}" -maxdepth 1 -iname "*progress*.md" -type f 2>/dev/null | head -1`;
            const { stdout } = await execAsync(command);
            const file = stdout.trim();
            if (file) {
                return path.basename(file);
            }
            return null;
        }
        catch {
            return null;
        }
    }
}
exports.ProjectDiscovery = ProjectDiscovery;
//# sourceMappingURL=projectDiscovery.js.map