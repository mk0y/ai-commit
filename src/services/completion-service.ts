/**
 * Completion service for Gity CLI
 * Provides shell completion and interactive menu functionality
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";

// List of all available gity commands
const GITY_COMMANDS = [
  { name: "open", description: "Open the current repository in browser" },
  { name: "help", description: "Show help information" },
  { name: "completion", description: "Install shell completion" },
];

/**
 * Generate shell completion scripts
 */
export function generateCompletionScript(shell: string = "zsh"): string {
  if (shell === "zsh") {
    return `
#compdef gity

_gity() {
  local -a commands
  commands=(
    "open:Open the current repository in browser"
    "help:Show help information"
    "completion:Install shell completion"
  )

  _describe 'command' commands
}

_gity "$@"
`;
  } else if (shell === "bash") {
    return `
_gity() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  opts="open help completion -h --help"

  if [[ \${cur} == * ]] ; then
    COMPREPLY=( \$(compgen -W "\${opts}" -- \${cur}) )
    return 0
  fi
}

complete -F _gity gity
`;
  }
  
  return "# Unsupported shell";
}

/**
 * Install completion script for the user's shell
 */
export function installCompletionScript(): void {
  try {
    // Detect shell
    const shell = process.env.SHELL?.split('/').pop() || "zsh";
    const script = generateCompletionScript(shell);
    
    if (shell === "zsh") {
      const completionDir = join(homedir(), ".zsh", "completion");
      const completionFile = join(completionDir, "_gity");
      
      // Create directory if it doesn't exist
      try {
        execSync(`mkdir -p ${completionDir}`);
      } catch (error) {
        console.error("Failed to create completion directory:", error);
      }
      
      // Write completion script
      writeFileSync(completionFile, script);
      
      console.log(`✅ ZSH completion installed to ${completionFile}`);
      console.log(`Add this to your ~/.zshrc if not already present:`);
      console.log(`fpath=(~/.zsh/completion $fpath)`);
      console.log(`autoload -U compinit && compinit`);
    } else if (shell === "bash") {
      const completionFile = join(homedir(), ".bash_completion.d", "gity");
      
      // Create directory if it doesn't exist
      try {
        execSync(`mkdir -p ${join(homedir(), ".bash_completion.d")}`);
      } catch (error) {
        console.error("Failed to create completion directory:", error);
      }
      
      // Write completion script
      writeFileSync(completionFile, script);
      
      console.log(`✅ Bash completion installed to ${completionFile}`);
      console.log(`Add this to your ~/.bashrc if not already present:`);
      console.log(`source ~/.bash_completion.d/gity`);
    } else {
      console.error(`❌ Unsupported shell: ${shell}`);
    }
  } catch (error) {
    console.error("❌ Failed to install completion script:", error);
  }
}

/**
 * Display interactive menu for command selection
 * @returns Selected command or null if cancelled
 */
export function showInteractiveMenu(): Promise<string | null> {
  return new Promise((resolve) => {
    // Use only gity commands for the menu
    const menuItems = GITY_COMMANDS;
    
    // Create readline interface
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Enable raw mode to capture arrow keys
    process.stdin.setRawMode?.(true);
    
    let selectedIndex = 0;
    const visibleItems = 10; // Number of items visible at once
    let scrollOffset = 0;
    let menuHeight = 0; // Track the height of the menu for proper clearing
    
    // Function to clear the previous menu output
    const clearPreviousOutput = () => {
      // Move cursor to beginning of the menu and clear everything below
      process.stdout.write(`\x1B[${menuHeight}A`); // Move cursor up
      process.stdout.write("\x1B[J"); // Clear from cursor to end of screen
    };
    
    // Function to render the menu
    const renderMenu = () => {
      // Clear previous menu if it exists
      if (menuHeight > 0) {
        clearPreviousOutput();
      }
      
      // Reset menu height counter
      menuHeight = 0;
      
      // Title and instructions (2 lines)
      console.log("\n🔍 Select a gity command (↑/↓ to navigate, Enter to select, Esc to cancel):\n");
      menuHeight += 3; // Title + empty line before + empty line after
      
      // Calculate visible range
      const startIdx = scrollOffset;
      const endIdx = Math.min(startIdx + visibleItems, menuItems.length);
      
      // Display menu items
      for (let i = startIdx; i < endIdx; i++) {
        const item = menuItems[i];
        const prefix = i === selectedIndex ? "› " : "  ";
        
        if (i === selectedIndex) {
          // Highlight selected item
          console.log(`\x1B[36m${prefix}${item.name.padEnd(15)} ${item.description}\x1B[0m`);
        } else {
          console.log(`${prefix}${item.name.padEnd(15)} ${item.description}`);
        }
        menuHeight++;
      }
      
      // Show scroll indicators if needed (up to 2 more lines)
      if (menuItems.length > visibleItems) {
        if (scrollOffset > 0) {
          process.stdout.write("   ↑ more\n");
          menuHeight++;
        } else {
          process.stdout.write("\n");
          menuHeight++;
        }
        
        if (endIdx < menuItems.length) {
          process.stdout.write("   ↓ more\n");
          menuHeight++;
        } else {
          process.stdout.write("\n");
          menuHeight++;
        }
      }
    };

    // Initial render
    renderMenu();

    // Handle key events
    process.stdin.on("data", (key) => {
      // Check for special keys
      if (key[0] === 27) { // ESC key or arrow keys
        if (key[1] === 91) {
          if (key[2] === 65) { // Up arrow
            selectedIndex = Math.max(0, selectedIndex - 1);
            
            // Scroll up if needed
            if (selectedIndex < scrollOffset) {
              scrollOffset = selectedIndex;
            }
            
            renderMenu();
          } else if (key[2] === 66) { // Down arrow
            selectedIndex = Math.min(menuItems.length - 1, selectedIndex + 1);
            
            // Scroll down if needed
            if (selectedIndex >= scrollOffset + visibleItems) {
              scrollOffset = selectedIndex - visibleItems + 1;
            }
            
            renderMenu();
          }
        } else {
          // ESC key alone
          process.stdin.setRawMode?.(false);
          process.stdin.removeAllListeners("data");
          rl.close();
          console.log("\n❌ Cancelled");
          resolve(null);
        }
      } else if (key[0] === 13) { // Enter key
        const selected = menuItems[selectedIndex];
        process.stdin.setRawMode?.(false);
        process.stdin.removeAllListeners("data");
        rl.close();
        console.log(`\n✅ Selected: ${selected.name}`);
        resolve(selected.name);
      }
    });
  });
}
