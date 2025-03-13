import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

// Function to get staged changes
export function getGitDiff(): string {
  try {
    return execSync("git diff --cached").toString();
  } catch (error) {
    console.error("Error: Ensure you have Git installed and changes staged.");
    process.exit(1);
  }
}

// Function to get the repository URL from .git/config
export function getRepoUrl(): string | null {
  try {
    // Check if .git directory exists
    const gitConfigPath = ".git/config";
    if (!existsSync(gitConfigPath)) {
      console.error("❌ Not a git repository or .git/config not found.");
      return null;
    }

    // Read and parse the git config file
    const configContent = readFileSync(gitConfigPath, "utf8");
    
    // Extract the remote origin URL using regex
    const urlMatch = configContent.match(/\[remote "origin"\][^\[]*url\s*=\s*([^\n\r]*)/);
    if (!urlMatch || !urlMatch[1]) {
      console.error("❌ Remote origin URL not found in git config.");
      return null;
    }

    return urlMatch[1].trim();
  } catch (error) {
    console.error("❌ Error reading git config:", error);
    return null;
  }
}

// Function to convert git URL to browser URL
export function gitUrlToBrowserUrl(gitUrl: string): string | null {
  try {
    // Handle SSH URL format (git@github.com:username/repo.git)
    if (gitUrl.startsWith("git@")) {
      const sshMatch = gitUrl.match(/git@([^:]+):([^\/]+)\/([^\.]+)\.git/);
      if (sshMatch) {
        const [, domain, username, repo] = sshMatch;
        return `https://${domain}/${username}/${repo}`;
      }
    }
    
    // Handle HTTPS URL format (https://github.com/username/repo.git)
    if (gitUrl.startsWith("https://") || gitUrl.startsWith("http://")) {
      return gitUrl.replace(/\.git$/, "");
    }
    
    console.error("❌ Unsupported git URL format:", gitUrl);
    return null;
  } catch (error) {
    console.error("❌ Error converting git URL:", error);
    return null;
  }
}

// Function to open the repository in the browser
export function openRepoInBrowser(): void {
  const repoUrl = getRepoUrl();
  if (!repoUrl) {
    process.exit(1);
  }

  const browserUrl = gitUrlToBrowserUrl(repoUrl);
  if (!browserUrl) {
    process.exit(1);
  }

  console.log(`🔗 Opening repository: ${browserUrl}`);
  
  try {
    // Use the appropriate open command based on the platform
    if (process.platform === "darwin") {  // macOS
      execSync(`open "${browserUrl}"`);
    } else if (process.platform === "win32") {  // Windows
      execSync(`start "${browserUrl}"`);
    } else {  // Linux and others
      execSync(`xdg-open "${browserUrl}"`);
    }
    console.log("✅ Repository opened in browser.");
  } catch (error) {
    console.error("❌ Error opening browser:", error);
    process.exit(1);
  }
}