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

export class ProjectDiscovery {
    async findProjects(): Promise<Project[]> {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const projects: Project[] = [];

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
                } catch {
                    // File not readable, skip
                }
            }

            // Sort by project name
            projects.sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            console.error('Error discovering projects:', error);
        }

        return projects;
    }

    async validateProject(projectPath: string): Promise<boolean> {
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
        } catch {
            return false;
        }
    }

    async findProgressFile(projectPath: string): Promise<string | null> {
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
        } catch {
            return null;
        }
    }
}