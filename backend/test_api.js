const http = require('http');

const data = JSON.stringify({
  orderNumber: 'TEST-HTTP-001',
  clientId: 1,
  productId: 1,
  plannedQty: 100,
  unit: 'Metros',
  creatorId: 1
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
