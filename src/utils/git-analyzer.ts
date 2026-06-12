import simpleGit, { SimpleGit } from "simple-git";
import { GitInfo, CommitInfo } from "../context/project-context.js";

export class GitAnalyzer {
  private git: SimpleGit;

  constructor(private projectPath: string) {
    this.git = simpleGit(projectPath);
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getGitInfo(): Promise<GitInfo | null> {
    try {
      const [status, log, remotes] = await Promise.all([
        this.git.status(),
        this.git.log({ maxCount: 10 }),
        this.git.getRemotes(true),
      ]);

      const recentCommits: CommitInfo[] = (log.all || []).map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: new Date(commit.date),
        filesChanged: [],
      }));

      // Get files changed in recent commits
      for (const commit of recentCommits.slice(0, 5)) {
        try {
          const diff = await this.git.diff([
            `${commit.hash}^`,
            commit.hash,
            "--name-only",
          ]);
          commit.filesChanged = diff.split("\n").filter((f) => f.trim().length > 0);
        } catch {
          // Some commits might not have parents
        }
      }

      const remoteUrl =
        remotes.length > 0 && remotes[0].refs
          ? remotes[0].refs.fetch || remotes[0].refs.push
          : undefined;

      return {
        currentBranch: status.current || "main",
        recentCommits,
        modifiedFiles: [...status.modified, ...status.not_added],
        stagedFiles: status.staged,
        uncommittedChanges:
          status.modified.length > 0 ||
          status.not_added.length > 0 ||
          status.staged.length > 0,
        remoteUrl,
      };
    } catch {
      return null;
    }
  }

  async getRecentlyModifiedFiles(days: number = 7): Promise<string[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const log = await this.git.log({
        "--since": since.toISOString(),
        "--name-only": null,
        "--format": "%n",
      });

      const files = new Set<string>();
      log.all.forEach((commit) => {
        if (commit.diff?.files) {
          commit.diff.files.forEach((file) => files.add(file.file));
        }
      });

      return Array.from(files);
    } catch {
      return [];
    }
  }
}
