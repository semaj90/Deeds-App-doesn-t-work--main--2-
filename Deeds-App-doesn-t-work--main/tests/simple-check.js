console.log('✅ Node.js is working');
console.log('🚀 Test environment ready');
console.log('📊 Server should be running on http://localhost:5175');

try {
  const url = 'http://localhost:5175';
  console.log(`🔗 Check server at: ${url}`);
} catch (error) {
  console.error('❌ Error:', error.message);
}
