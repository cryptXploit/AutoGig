const http = require('http');

const putData = JSON.stringify({
  userId: 'user-local',
  theme: 'HACKER',
  language: 'BN',
  reasoningDepth: 'HIGH'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/preferences',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(putData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('PUT RESPONSE:', data);
    
    // Now GET
    http.get('http://localhost:8080/api/preferences', (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        console.log('GET RESPONSE:', data2);
      });
    });
  });
});

req.write(putData);
req.end();
