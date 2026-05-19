import net from 'net';

const client = net.connect({ port: 3001, host: '127.0.0.1' }, () => {
  console.log('CONNECTED');
  client.end();
});

client.on('error', (err) => {
  console.error('ERROR:', err.message);
});
