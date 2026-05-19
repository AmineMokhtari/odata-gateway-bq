import http from 'http';

const req = http.get('http://127.0.0.1:3001/v1/project-id/dataset-id/Entities', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => console.log(`BODY: ${chunk}`));
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});
