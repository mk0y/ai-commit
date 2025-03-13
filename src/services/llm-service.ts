/**
 * LLM Service
 * 
 * This module provides an abstraction layer for generating commit messages
 * using different LLM providers. It supports OpenAI by default but can be
 * extended to use other providers.
 */

import fetch from "node-fetch";

// Interface for LLM provider configuration
export interface LLMProviderConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}

// Interface for LLM provider implementation
export interface LLMProvider {
  generateCommit(diff: string, config: LLMProviderConfig): Promise<string>;
}

/**
 * Helper function to clean LLM responses by removing unwanted double quotes wrapping the content
 * @param text The text response from LLM
 * @returns Cleaned text without surrounding double quotes
 */
function cleanLLMResponse(text: string): string {
  // Check if the text is wrapped in double quotes and remove them
  if (text && text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1);
  }
  return text;
}

// OpenAI Provider implementation
export class OpenAIProvider implements LLMProvider {
  async generateCommit(diff: string, config: LLMProviderConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("API key is required for OpenAI provider");
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model || "gpt-4",
          messages: [
            { role: "system", content: "You are an AI that generates concise and meaningful Git commit messages based on code changes." },
            { role: "user", content: `Generate a commit message for the following code changes:\n\n${diff}` }
          ],
          max_tokens: config.maxTokens || 50
        })
      });
      
      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };
      const content = data.choices?.[0]?.message?.content || "chore: update code";
      return cleanLLMResponse(content);
    } catch (error) {
      console.error("❌ Failed to generate commit message:", error);
      return "chore: update code";
    }
  }
}

// Anthropic Claude Provider implementation
export class AnthropicProvider implements LLMProvider {
  async generateCommit(diff: string, config: LLMProviderConfig): Promise<string> {
    if (!config.apiKey) {
      throw new Error("API key is required for Anthropic provider");
    }
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model || "claude-3-haiku-20240307",
          system: "You are an AI that generates concise and meaningful Git commit messages based on code changes.",
          messages: [
            { role: "user", content: `Generate a commit message for the following code changes:\n\n${diff}` }
          ],
          max_tokens: config.maxTokens || 50
        })
      });
      
      const data = await response.json() as {
        content?: Array<{
          text?: string;
        }>;
      };
      const content = data.content?.[0]?.text || "chore: update code";
      return cleanLLMResponse(content);
    } catch (error) {
      console.error("❌ Failed to generate commit message:", error);
      return "chore: update code";
    }
  }
}

// Factory to get the appropriate LLM provider
export function getLLMProvider(providerName: string = "openai"): LLMProvider {
  switch (providerName.toLowerCase()) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    // Add more providers here as needed
    default:
      return new OpenAIProvider();
  }
}

// Main function to generate commit message using any provider
export async function generateCommit(
  diff: string, 
  providerName: string = "openai", 
  config: LLMProviderConfig
): Promise<string> {
  const provider = getLLMProvider(providerName);
  return provider.generateCommit(diff, config);
}
