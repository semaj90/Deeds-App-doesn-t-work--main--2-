use anyhow::Result;
use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

// Simple token structure without JWT (avoiding ring dependency)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SimpleToken {
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
    pub issued_at: i64,
    pub expires_at: i64,
    pub token_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub role: String,
    pub exp: usize, // Expiration time
    pub iat: usize, // Issued at
}

impl Claims {
    pub fn new(user_id: Uuid, email: String, role: String) -> Self {
        let now = Utc::now();
        let exp = (now + Duration::days(30)).timestamp() as usize; // 30 days
        let iat = now.timestamp() as usize;

        Self {
            sub: user_id.to_string(),
            email,
            role,
            exp,
            iat,
        }
    }
}

// Simple password hashing using SHA256 (not production-ready, just for development)
pub fn hash_password(password: &str, cost: u32) -> Result<String> {
    // Generate a simple salt based on the cost parameter
    let salt = format!("prosecutor_salt_{}", cost);
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update(salt.as_bytes());
    let result = hasher.finalize();
    Ok(STANDARD.encode(result))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    // Use default cost for verification
    let computed_hash = hash_password(password, 12)?;
    Ok(computed_hash == hash)
}

// Simple token generation (base64 encoded JSON, not secure for production)
pub fn create_jwt(claims: &Claims, _secret: &str) -> Result<String> {
    let token = SimpleToken {
        user_id: Uuid::parse_str(&claims.sub)?,
        email: claims.email.clone(),
        role: claims.role.clone(),
        issued_at: claims.iat as i64,
        expires_at: claims.exp as i64,
        token_type: "Bearer".to_string(),
    };
    
    let json = serde_json::to_string(&token)?;
    Ok(STANDARD.encode(json.as_bytes()))
}

pub fn verify_jwt(token: &str, _secret: &str) -> Result<SimpleToken> {
    let decoded = STANDARD.decode(token)?;
    let json = String::from_utf8(decoded)?;
    let token: SimpleToken = serde_json::from_str(&json)?;
    
    let now = Utc::now().timestamp();
    if token.expires_at < now {
        return Err(anyhow::anyhow!("Token expired"));
    }
    
    Ok(token)
}

// Generate a random salt
pub fn generate_salt() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let salt: Vec<u8> = (0..16).map(|_| rng.gen()).collect();
    STANDARD.encode(salt)
}
