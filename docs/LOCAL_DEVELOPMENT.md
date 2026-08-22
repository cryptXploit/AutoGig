# AutoGig Local Development Workflow

This document outlines the standard Windows + VS Code local development workflow for AutoGig.

## A. Prerequisites
- Node.js 22.x+
- npm 10.x+
- VS Code
- Git

## B. Install
Clone the repository and install dependencies:
```bash
npm install
```

## C. Create Environment
Copy the example environment variables to create your local uncommitted file:
```bash
copy .env.example .env.local
```
**Important:** `.env.local` is strictly `.gitignore`d. Never commit this file.

## D. Configure Mock Mode
In your `.env.local`, ensure you have:
```env
AI_PROVIDER=mock
```
This allows the entire system to run fully offline without any Gemini dependencies.

## E. Initialize / Reset Database
Ensure your local SQLite database is cleanly initialized:
```bash
npm run db:reset
```

## F. Ingest Demo Data
Populate the database with the local demo opportunities:
```bash
npm run ingest:demo
```

## G. Start Backend
Run the Web API server on port 8080:
```bash
npm run dev:api
```

## H. Start Frontend
Run the Next.js App Router on port 3000:
```bash
npm run dev:web
```

## I. Start Opportunity Worker
Start the background daemon that evaluates opportunities:
```bash
npm run dev:worker
```

## J. Optional: Real Gemini Mode
To test real AI logic, modify your `.env.local`:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-real-key-here
```
Then run the optional smoke test to verify execution:
```bash
npm run test:gemini:smoke
```

## Running Everything Concurrently
To run the Web API, Frontend, and Worker in a single terminal concurrently, use:
```bash
npm run dev:all
```
