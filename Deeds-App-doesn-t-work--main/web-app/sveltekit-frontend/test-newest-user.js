import bcrypt from 'bcrypt';

const storedHash = '$2b$10$KCxx1fs2FucI2sdoS6yoC.dHxZLlHyxw.FOqkbxkVzlWJM/eqdrpi';
const password = 'TestPassword123!';

async function test() {
  try {
    const result = await bcrypt.compare(password, storedHash);
    console.log('Password matches newest user hash:', result);
    
    // Test variations
    const variations = [
      'TestPassword123!',
      'testpassword123!',
      'TestPassword123',
      'Test User',
      'password',
      'test123',
      'Test123!'
    ];
    
    for (const variation of variations) {
      const matches = await bcrypt.compare(variation, storedHash);
      console.log(`"${variation}" matches:`, matches);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
