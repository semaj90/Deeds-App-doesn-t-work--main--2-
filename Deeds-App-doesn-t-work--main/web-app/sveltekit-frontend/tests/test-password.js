// Test script to debug password hashing and verification
import bcrypt from 'bcrypt';

async function testPassword() {
  const password = 'TestPassword123!';
  
  // Test with different salt rounds
  console.log('Testing password hashing and comparison...');
  
  const hash10 = await bcrypt.hash(password, 10);
  const hash12 = await bcrypt.hash(password, 12);
  
  console.log('Password:', password);
  console.log('Hash (10 rounds):', hash10);
  console.log('Hash (12 rounds):', hash12);
  
  const verify10 = await bcrypt.compare(password, hash10);
  const verify12 = await bcrypt.compare(password, hash12);
  
  console.log('Verify 10 rounds:', verify10);
  console.log('Verify 12 rounds:', verify12);
  
  // Test wrong password
  const verifyWrong = await bcrypt.compare('wrongpassword', hash12);
  console.log('Verify wrong password:', verifyWrong);
}

testPassword().catch(console.error);
