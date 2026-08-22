# Environment Configuration

AutoGig relies on environment variables for local configuration.

## Files
- `.env.example`: A template containing all required keys. Commit this file.
- `.env.local`: Your personal configuration containing real secrets. **NEVER COMMIT THIS FILE.**

## Variables
- `AI_PROVIDER`: `mock` (default) or `gemini` (real integration).
- `GEMINI_API_KEY`: Required if `AI_PROVIDER=gemini`. Next.js must NEVER read this key.
- `GEMINI_MODEL`: Defaults to `gemini-3.5-flash`.
- `GEMINI_THINKING_LEVEL`: `LOW`, `MEDIUM`, or `HIGH`.
- `PORT`: Web API port (default 8080).
- `WEB_APP_URL`: Frontend URL (default `http://localhost:3000`).
- `WEB_API_URL`: Backend URL (default `http://localhost:8080`).

## Security
The `GEMINI_API_KEY` is loaded exclusively by `@autogig/ai` during backend/worker initialization. It must never be prefixed with `NEXT_PUBLIC_` and must never be exposed to the browser.
