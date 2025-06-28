#!/usr/bin/env node

import fetch from 'node-fetch';

async function testRegistration() {
    console.log('🔍 Testing user registration via API...');
    
    try {
        const response = await fetch('http://localhost:5173/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'testpassword123'
            })
        });
        
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const result = await response.text();
        console.log('Response:', result);
        
    } catch (error) {
        console.error('❌ Error during registration test:', error);
    }
}

testRegistration();
