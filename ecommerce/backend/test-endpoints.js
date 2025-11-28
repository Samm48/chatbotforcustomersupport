const http = require('http');

const tests = [
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/products', name: 'Products API' },
  { method: 'POST', path: '/api/auth/login', name: 'Auth Login' },
  { method: 'GET', path: '/api/chat/history?userId=1', name: 'Chat History' }
];

tests.forEach(test => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: test.path,
    method: test.method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (test.method === 'POST') {
    options.headers['Content-Length'] = JSON.stringify({ email: 'demo@example.com', password: 'demo123' }).length;
  }

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ ${test.name}: ${res.statusCode} ${res.statusMessage}`);
      if (data) {
        try {
          const json = JSON.parse(data);
          console.log(`   Response:`, json.message || 'Success');
        } catch (e) {
          console.log(`   Response:`, data.substring(0, 100));
        }
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ ${test.name}: ${error.message}`);
  });

  if (test.method === 'POST') {
    req.write(JSON.stringify({ email: 'demo@example.com', password: 'demo123' }));
  }

  req.end();
});