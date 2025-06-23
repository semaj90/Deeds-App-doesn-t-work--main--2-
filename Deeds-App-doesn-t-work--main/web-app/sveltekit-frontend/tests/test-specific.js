// Test specific password hash from database
import bcrypt from 'bcrypt';

async function testSpecificHash() {
  const password = 'TestPassword123!';
  const storedHash = '$2b$10$WRtowERVybS5JxE9HqK8aemQPeXXGj9FnOt8H.Wy0HLTRyYHOd7D2';
  
  console.log('Testing password:', password);
  console.log('Against stored hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password matches stored hash:', isValid);
  
  // Test various common passwords to see if any match
  const testPasswords = [
    'TestPassword123!',
    'testpassword123!',
    'TestPassword123',
    'Test User',
    'password',
    'test123',
    'Test123!'
  ];
  
  for (const testPwd of testPasswords) {
    const matches = await bcrypt.compare(testPwd, storedHash);
    console.log(`"${testPwd}" matches:`, matches);
  }
}

testSpecificHash().catch(console.error);
