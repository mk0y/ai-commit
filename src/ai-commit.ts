#!/usr/bin/env node

/**
 * AI Commit CLI Tool
 * 
 * This script automates the process of generating meaningful Git commit messages
 * using LLM models. It analyzes staged changes (`git diff --cached`),
 * suggests a commit message, and allows developers to:
 *   - Accept the suggestion and commit immediately.
 *   - Edit the generated message in their preferred editor.
 *   - Regenerate a new message.
 *   - Cancel the commit process.
 * 
 * Environment Variables:
 *   - OPENAI_API_KEY: API key for OpenAI GPT (required when using OpenAI provider).
 *   - ANTHROPIC_API_KEY: API key for Anthropic Claude (required when using Anthropic provider).
 *   - LLM_PROVIDER: LLM provider to use (default: "openai", options: "openai", "anthropic").
 *   - LLM_MODEL: Model to use with the provider (optional).
 *   - LLM_MAX_TOKENS: Maximum tokens for the response (optional).
 * 
 * Installation:
 *   1. Save this file as `ai-commit.ts`
 *   2. Make it executable: `chmod +x ai-commit.ts`
 *   3. Optionally move it to a global location: `mv ai-commit.ts /usr/local/bin/ai-commit`
 *   4. Run it inside a Git repository: `ai-commit`
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { createInterface } from "readline";
import { tmpdir } from "os";
import { join } from "path";
import dotenv from "dotenv";
import { generateCommit, LLMProviderConfig } from "./services/llm-service.js";

dotenv.config();

const TEMP_FILE = join(tmpdir(), "ai_commit_msg.txt");
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";
const LLM_MODEL = process.env.LLM_MODEL;
const LLM_MAX_TOKENS = process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : undefined;

// Get the appropriate API key based on provider
function getApiKey(): string | undefined {
  switch (LLM_PROVIDER.toLowerCase()) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    default:
      return process.env.OPENAI_API_KEY;
  }
}

const API_KEY = getApiKey();

// Check for required API key based on provider
if (!API_KEY) {
  console.error(`❌ API key not found for provider "${LLM_PROVIDER}".`);
  if (LLM_PROVIDER.toLowerCase() === "openai") {
    console.error("Set OPENAI_API_KEY in your environment variables.");
  } else if (LLM_PROVIDER.toLowerCase() === "anthropic") {
    console.error("Set ANTHROPIC_API_KEY in your environment variables.");
  }
  process.exit(1);
}

// Function to get staged changes
function getGitDiff(): string {
  try {
    const stagedDiff = execSync("git diff --cached").toString();
    if (!stagedDiff.trim()) {
      // Check if there are unstaged changes
      const unstagedChanges = execSync("git diff").toString();
      const unstagedStatus = execSync("git status --porcelain").toString();
      
      if (unstagedChanges.trim() || unstagedStatus.includes("??")) {
        console.error("No staged changes found, but there are unstaged changes.");
        console.error("Use 'git add <file>' to stage the changes you want to commit.");
        process.exit(1);
      }
    }
    return stagedDiff;
  } catch (error) {
    console.error("Error: Ensure you have Git installed and changes staged.");
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log(`🔍 Analyzing staged changes using ${LLM_PROVIDER}...`);
  const diff = getGitDiff();
  if (!diff.trim()) {
    console.error("No staged changes found.");
    process.exit(1);
  }

  const llmConfig: LLMProviderConfig = {
    apiKey: API_KEY,
    model: LLM_MODEL,
    maxTokens: LLM_MAX_TOKENS
  };

  try {
    let commitMessage = await generateCommit(diff, LLM_PROVIDER, llmConfig);
    console.log("\n💡 Suggested commit message:");
    console.log(`\n"${commitMessage}"\n`);

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    function promptUser(): void {
      rl.question("(Enter = confirm, e = edit, r = regenerate, q = quit) > ", async (answer) => {
        try {
          if (answer === "e") {
            writeFileSync(TEMP_FILE, commitMessage);
            execSync(`${process.env.EDITOR || "vim"} ${TEMP_FILE}`, { stdio: "inherit" });
            commitMessage = readFileSync(TEMP_FILE, "utf8").trim();
            unlinkSync(TEMP_FILE);
            promptUser();
          }
          else if (answer === "r") {
            commitMessage = await generateCommit(diff, LLM_PROVIDER, llmConfig);
            console.log("\n💡 New suggested commit message:");
            console.log(`\n"${commitMessage}"\n`);
            promptUser();
          }
          else if (answer === "q") {
            console.log("❌ Commit canceled.");
            rl.close();
            process.exit(0);
          }
          else {
            execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
            console.log("✅ Commit successful.");
            rl.close();
            process.exit(0);
          }
        } catch (error) {
          console.error("❌ Error:", error);
          rl.close();
          process.exit(1);
        }
      });
    }

    promptUser();
  } catch (error) {
    console.error("❌ Error generating commit message:", error);
    process.exit(1);
  }
}

main();
