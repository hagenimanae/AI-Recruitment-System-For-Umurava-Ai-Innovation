const http = require('http');

http.get('http://localhost:5000/api/jobs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('GET /api/jobs Response:', res.statusCode, data);
  });
}).on('error', err => console.log('Error GET jobs:', err.message));
