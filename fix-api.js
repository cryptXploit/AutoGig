const fs = require('fs');
let code = fs.readFileSync('apps/web-api/src/index.ts', 'utf-8');

const healthEndpoint = `
app.get('/api/health', (req, res) => {
  try {
    const row = db.prepare('SELECT 1').get();
    const dbUp = !!row;
    res.json({
      success: true,
      data: {
        api: 'UP',
        database: dbUp ? 'UP' : 'DOWN',
        aiProvider: process.env.AI_PROVIDER || 'mock',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.json({
      success: false,
      data: {
        api: 'UP',
        database: 'DOWN',
        aiProvider: process.env.AI_PROVIDER || 'mock',
        timestamp: new Date().toISOString()
      }
    });
  }
});
`;

code = code.replace("app.get('/api/runs',", healthEndpoint + "\napp.get('/api/runs',");

fs.writeFileSync('apps/web-api/src/index.ts', code);
