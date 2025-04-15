// run-server.js
require('bytenode'); // Must load bytenode first

try {
  // Load your compiled server
  require('./server.jsc');
  console.log('Server started successfully');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
