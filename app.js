const http = require('http');

const server = http.createServer((req, res) => {
  // 1. Change Content-Type to HTML
  res.writeHead(200, { 'Content-Type': 'text/html' });

  // 2. Define a beautiful HTML structure with CSS
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Odo Kingsley - ECS App</title>
        <style>
            body { 
                font-family: 'Inter', -apple-system, sans-serif; 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #2d3748;
            }
            .card { 
                background: white; padding: 2.5rem; border-radius: 20px; 
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                text-align: center; max-width: 400px; width: 90%;
            }
            h1 { color: #4a5568; margin-bottom: 0.5rem; font-size: 1.5rem; }
            p { font-size: 1.1rem; line-height: 1.6; color: #718096; }
            .rocket { font-size: 3rem; margin-bottom: 1rem; display: block; }
            .version-tag { 
                display: inline-block; background: #edf2f7; color: #4a5568; 
                padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; 
                font-weight: 600; margin-top: 1.5rem;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="rocket">🚀</span>
            <h1>Hello, I'm Odo Kingsley Uchenna!</h1>
            <p>I'm currently reaching out to you from a containerized <strong>Node.js</strong> app running on <strong>Amazon ECS</strong>.</p>
            <div class="version-tag">Version ${process.env.APP_VERSION || '1.0.0'}</div>
        </div>
    </body>
    </html>
  `;

  res.end(htmlContent);
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
