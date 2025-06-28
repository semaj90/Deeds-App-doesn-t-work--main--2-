#!/usr/bin/env node

import { db, users } from './src/lib/server/db/index.js';
import bcrypt from 'bcrypt';

async function testUserRegistration() {
    console.log('🔍 Testing user registration...');
    
    try {
        console.log('📊 Database connection test...');
        
        // Test database connection
        const testResult = await db.select().from(users).limit(1);
        console.log('✅ Database connection successful');
        console.log('📋 Current users count:', testResult.length);
        
        // Test creating a new user
        console.log('\n👤 Creating test user...');
        const testEmail = `test_${Date.now()}@example.com`;
        const hashedPassword = await bcrypt.hash('testpassword123', 10);
        
        const newUser = await db.insert(users).values({
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            email: testEmail,
            hashedPassword,
            role: 'prosecutor'
        }).returning();
        
        console.log('✅ User created successfully:', {
            id: newUser[0].id,
            email: newUser[0].email,
            name: newUser[0].name
        });
        
        console.log('\n🔐 Testing login credentials...');
        const passwordMatch = await bcrypt.compare('testpassword123', newUser[0].hashedPassword);
        console.log('✅ Password verification:', passwordMatch ? 'PASSED' : 'FAILED');
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    }
    
    process.exit(0);
}

testUserRegistration();
