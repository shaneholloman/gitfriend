import { Octokit } from "@octokit/rest";

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch repository: ${error}`);
    }
  }

  async createOrUpdateReadme(
    owner: string,
    repo: string,
    content: string,
    branch: string = "main"
  ) {
    try {
      // Check if README.md already exists
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: "README.md",
          ref: branch,
        });
        
        if ("sha" in data) {
          sha = data.sha;
        }
      } catch (error: any) {
        // File doesn't exist, that's okay
        if (error.status !== 404) {
          throw error;
        }
      }

      // Create or update the file
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: "README.md",
        message: sha 
          ? "docs: Update README.md via Git Friend" 
          : "docs: Add README.md via Git Friend",
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(sha && { sha }),
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to create/update README: ${error}`);
    }
  }

  async listBranches(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
      });
      return data.map(branch => branch.name);
    } catch (error) {
      throw new Error(`Failed to list branches: ${error}`);
    }
  }

  async checkWriteAccess(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data.permissions?.push || data.permissions?.admin || false;
    } catch (error) {
      return false;
    }
  }
}