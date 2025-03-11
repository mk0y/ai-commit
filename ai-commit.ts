#!/usr/bin/env node

/**
 * AI Commit CLI Tool
 * 
 * This script automates the process of generating meaningful Git commit messages
 * using OpenAI's GPT model. It analyzes staged changes (`git diff --cached`),
 * suggests a commit message, and allows developers to:
 *   - Accept the suggestion and commit immediately.
 *   - Edit the generated message in their preferred editor.
 *   - Regenerate a new message.
 *   - Cancel the commit process.
 * 
 * Environment Variables:
 *   - OPENAI_API_KEY: API key for OpenAI GPT (required).
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
import fetch from "node-fetch";

dotenv.config();

const TEMP_FILE = join(tmpdir(), "ai_commit_msg.txt");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ OpenAI API key not found. Set OPENAI_API_KEY in your environment variables.");
  process.exit(1);
}

// Function to get staged changes
function getGitDiff(): string {
  try {
    return execSync("git diff --cached").toString();
  } catch (error) {
    console.error("Error: Ensure you have Git installed and changes staged.");
    process.exit(1);
  }
}

// Function to call OpenAI API for commit message generation
async function generateCommitMessage(diff: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an AI that generates concise and meaningful Git commit messages based on code changes." },
          { role: "user", content: `Generate a commit message for the following code changes:\n\n${diff}` }
        ],
        max_tokens: 50
      })
    });
    
    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    return data.choices?.[0]?.message?.content || "chore: update code";
  } catch (error) {
    console.error("❌ Failed to generate commit message:", error);
    return "chore: update code";
  }
}

async function main(): Promise<void> {
  console.log("🔍 Analyzing staged changes...");
  const diff = getGitDiff();
  if (!diff.trim()) {
    console.error("No staged changes found.");
    process.exit(1);
  }

  let commitMessage = await generateCommitMessage(diff);
  console.log("\n💡 Suggested commit message:");
  console.log(`\n"${commitMessage}"\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  function promptUser(): void {
    rl.question("(Enter = confirm, e = edit, r = regenerate, q = quit) > ", async (answer) => {
      if (answer === "e") {
        writeFileSync(TEMP_FILE, commitMessage);
        execSync(`${process.env.EDITOR || "vim"} ${TEMP_FILE}`, { stdio: "inherit" });
        commitMessage = readFileSync(TEMP_FILE, "utf8").trim();
        unlinkSync(TEMP_FILE);
      }
      else if (answer === "r") {
        commitMessage = await generateCommitMessage(diff);
        console.log("\n💡 New suggested commit message:");
        console.log(`\n"${commitMessage}"\n`);
        return promptUser();
      }
      else if (answer === "q") {
        console.log("❌ Commit canceled.");
        process.exit(0);
      }
      else {
        execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
        console.log("✅ Commit successful.");
        process.exit(0);
      }
      promptUser();
    });
  }

  promptUser();
}

main();
