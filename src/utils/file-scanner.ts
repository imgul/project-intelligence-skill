import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { FileInfo } from "../context/project-context.js";

export class FileScanner {
  private readonly ignoredPatterns = [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "tests/fixtures/**",
    ".next/**",
    "__pycache__/**",
    "*.pyc",
    ".env",
    "*.min.js",
    "*.min.css",
    "coverage/**",
    ".nyc_output/**",
  ];

  async scanDirectory(dirPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const filePaths = await glob("**/*", {
        cwd: dirPath,
        ignore: this.ignoredPatterns,
        nodir: true,
        absolute: false,
        dot: true,
      });

      for (const filePath of filePaths.slice(0, 500)) {
        // Limit to 500 files
        const fullPath = path.join(dirPath, filePath);
        try {
          const stats = fs.statSync(fullPath);
          const extension = path.extname(filePath).toLowerCase();

          const fileInfo: FileInfo = {
            path: filePath,
            extension,
            size: stats.size,
            lastModified: stats.mtime,
          };

          // Read content for small text files
          if (stats.size < 50000 && this.isTextFile(extension)) {
            try {
              fileInfo.content = fs.readFileSync(fullPath, "utf-8");
            } catch {
              // Skip unreadable files
            }
          }

          files.push(fileInfo);
        } catch {
          // Skip files we can't access
        }
      }
    } catch (error) {
      console.error("Error scanning directory:", error);
    }

    return files;
  }

  private isTextFile(extension: string): boolean {
    const textExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".php",
      ".rb",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".html",
      ".htm",
      ".xml",
      ".json",
      ".yaml",
      ".yml",
      ".toml",
      ".env.example",
      ".md",
      ".mdx",
      ".txt",
      ".sh",
      ".bash",
      ".dockerfile",
      ".sql",
      ".graphql",
      ".prisma",
    ];
    return textExtensions.includes(extension) || extension === "";
  }

  readFileContent(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  getDirectories(dirPath: string): string[] {
    try {
      return fs
        .readdirSync(dirPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .filter((dirent) => !dirent.name.startsWith("."))
        .filter((dirent) => dirent.name !== "node_modules")
        .map((dirent) => dirent.name);
    } catch {
      return [];
    }
  }
}
