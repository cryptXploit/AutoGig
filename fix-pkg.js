const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['dev:web'] = "npm --workspace=web-app run dev";
pkg.scripts['dev:api'] = "dotenv -e .env.local -- npm --workspace=web-api run dev";
pkg.scripts['dev:worker'] = "dotenv -e .env.local -- npm --workspace=opportunity-worker run dev";
pkg.scripts['dev:all'] = "concurrently \"npm run dev:api\" \"npm run dev:web\" \"npm run dev:worker\"";
pkg.scripts['test:gemini:smoke'] = "dotenv -e .env.local -- node smoke-test.js";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
