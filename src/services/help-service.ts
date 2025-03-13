/**
 * Help service for Gity CLI
 * Provides help text and command documentation
 */

/**
 * Display help information for gity
 */
export function showHelp(): void {
  const helpText = `
Gity CLI - Git with AI-powered commit messages

USAGE:
  gity                     Generate AI commit message for staged changes
  gity open                Open the current repository in browser
  gity [git command]       Execute any git command (fallback to git)
  gity help, -h, --help    Show this help message
  gity completion          Install shell completion for TAB completion
  gity menu                Show interactive command selection menu

EXAMPLES:
  gity                        Generate commit message for staged changes
  gity open                   Open repository in browser
  gity push -u origin main    Push to remote (falls back to git)
  gity status                 Check status (falls back to git)
  gity completion             Install shell TAB completion
  gity menu                   Select command from interactive menu

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY           API key for OpenAI GPT
  ANTHROPIC_API_KEY        API key for Anthropic Claude
  LLM_PROVIDER             LLM provider to use (default: "openai")
  LLM_MODEL                Model to use with the provider (e.g. gpt-4o-mini-2024-07-18)
  LLM_MAX_TOKENS           Maximum tokens for the response

For more information, visit: https://github.com/mk0y/gity
`;

  console.log(helpText);
}

/**
 * Check if the provided argument is a help flag
 */
export function isHelpFlag(arg: string | undefined): boolean {
  return arg === "-h" || arg === "--help";
}
