const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: "Hello I'm Odo Kingsley Uchenna reaching out from ECS! 🚀",
    version: process.env.APP_VERSION || '1.0.0'
  }));
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});