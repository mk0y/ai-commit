# AI Commit

AI-powered Git commit message generator using OpenAI GPT.

## Overview

AI Commit is a command-line tool that uses OpenAI's GPT model to automatically generate meaningful Git commit messages based on your staged changes. It analyzes the diff of your staged files and suggests a concise, descriptive commit message following best practices.

## Features

- 🔍 Analyzes your staged Git changes
- 💡 Generates meaningful commit messages using OpenAI GPT
- ✏️ Allows editing the suggested message in your preferred editor
- 🔄 Option to regenerate a new message
- ✅ Simple and intuitive CLI interface

## Installation

### Using npx (recommended)

```bash
npx ai-commit
```

### Global Installation

```bash
npm install -g ai-commit
```

Then use it in any Git repository:

```bash
ai-commit
```

## Prerequisites

- Node.js 16 or higher
- Git
- OpenAI API key

## Setup

1. Get an OpenAI API key from [OpenAI's platform](https://platform.openai.com/api-keys)
2. Set your API key as an environment variable:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Alternatively, you can create a `.env` file in your project root:

```
OPENAI_API_KEY=your_api_key_here
```

## Usage

1. Stage your changes with `git add`
2. Run `ai-commit`
3. Choose an option:
   - Press Enter to accept and commit the suggested message
   - Press `e` to edit the message in your default editor
   - Press `r` to regenerate a new message
   - Press `q` to quit without committing

## Development

```bash
# Clone the repository
git clone https://github.com/mk0y/ai-commit.git
cd ai-commit

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start
```

## License

ISC

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
