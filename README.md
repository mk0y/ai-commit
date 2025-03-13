# Gity

AI-powered Git commit message generator using various LLM providers.

## Overview

Gity is a command-line tool that uses Large Language Models to automatically generate meaningful Git commit messages based on your staged changes. It analyzes the diff of your staged files and suggests a concise, descriptive commit message following best practices.

## Features

- 🔍 Analyzes your staged Git changes
- 💡 Generates meaningful commit messages using LLM models
- 🔄 Support for multiple LLM providers (OpenAI, Anthropic, etc.)
- ✏️ Allows editing the suggested message in your preferred editor
- 🔄 Option to regenerate a new message
- 🌐 Open your repository in the browser with a simple command
- ✅ Simple and intuitive CLI interface

## Installation

### Using npx (recommended)

```bash
npx gity
```

### Global Installation

```bash
npm install -g gity
```

Then use it in any Git repository:

```bash
gity
```

## Prerequisites

- Node.js 16 or higher
- Git
- API key for your chosen LLM provider (OpenAI by default)

## Setup

### OpenAI (Default)

1. Get an OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)
2. Set your API key as an environment variable:

```bash
export OPENAI_API_KEY=your_api_key_here
```

### Anthropic Claude

1. Get an Anthropic API key from [Anthropic's console](https://console.anthropic.com/)
2. Set your API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
export LLM_PROVIDER=anthropic
```

### Environment Variables

You can configure Gity using the following environment variables:

- `OPENAI_API_KEY`: API key for OpenAI (required when using OpenAI provider)
- `ANTHROPIC_API_KEY`: API key for Anthropic (required when using Anthropic provider)
- `LLM_PROVIDER`: LLM provider to use (default: "openai", options: "openai", "anthropic")
- `LLM_MODEL`: Model to use with the provider (optional)
- `LLM_MAX_TOKENS`: Maximum tokens for the response (optional)

Alternatively, you can create a `.env` file in your project root with these variables.

## Usage

### Generate Commit Message

1. Stage your changes with `git add`
2. Run `gity`
3. Choose an option:
   - Press Enter to accept and commit the suggested message
   - Press `e` to edit the message in your default editor
   - Press `r` to regenerate a new message
   - Press `q` to quit without committing

### Open Repository in Browser

To open the current repository in your default web browser:

```bash
gity open
```

This command parses your `.git/config` file, extracts the repository URL, and opens it in your default browser. It supports both SSH and HTTPS remote URL formats.

## Development

```bash
# Clone the repository
git clone https://github.com/mk0y/gity.git
cd gity

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start
```

## Extending with New LLM Providers

Gity is designed to be easily extended with new LLM providers. To add a new provider:

1. Implement the `LLMProvider` interface in `services/llm-service.ts`
2. Add your provider to the `getLLMProvider` factory function
3. Update the `getApiKey` function in `git-sage.ts` to handle your provider's API key

## License

ISC

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
