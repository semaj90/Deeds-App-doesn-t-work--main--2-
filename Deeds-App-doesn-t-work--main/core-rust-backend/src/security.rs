// Security module for prosecutor-core
// Handles authentication, encryption, and secure data storage

use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};

// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // user_id
    pub role: String, // user role
    pub exp: usize,   // expiration timestamp
    pub iat: usize,   // issued at timestamp
}

// Configuration for security
pub struct SecurityConfig {
    pub jwt_secret: String,
    pub token_expiry_hours: u64,
    pub bcrypt_cost: u32,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "default-secret-change-in-production".to_string()),
            token_expiry_hours: 24, // 24 hours
            bcrypt_cost: DEFAULT_COST,
        }
    }
}

// Authentication service
pub struct AuthService {
    config: SecurityConfig,
}

impl AuthService {
    pub fn new(config: SecurityConfig) -> Self {
        Self { config }
    }

    // Hash password using bcrypt
    pub fn hash_password(&self, password: &str) -> Result<String> {
        let hashed = hash(password, self.config.bcrypt_cost)?;
        Ok(hashed)
    }

    // Verify password against hash
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool> {
        let is_valid = verify(password, hash)?;
        Ok(is_valid)
    }

    // Generate JWT token
    pub fn generate_token(&self, user_id: &str, role: &str) -> Result<String> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs() as usize;
        let exp = now + (self.config.token_expiry_hours * 3600) as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            role: role.to_string(),
            exp,
            iat: now,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt_secret.as_ref()),
        )?;

        Ok(token)
    }

    // Validate and decode JWT token
    pub fn validate_token(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.jwt_secret.as_ref()),
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }
}

// Encryption service for sensitive data (using AES-256)
pub struct EncryptionService {
    key: [u8; 32], // 256-bit key
}

impl EncryptionService {
    pub fn new(key_material: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(key_material.as_bytes());
        let key: [u8; 32] = hasher.finalize().into();
        
        Self { key }
    }

    // Simple encryption using XOR (for demonstration - use AES in production)
    pub fn encrypt(&self, data: &str) -> String {
        let encrypted: Vec<u8> = data
            .bytes()
            .enumerate()
            .map(|(i, b)| b ^ self.key[i % 32])
            .collect();
        
        general_purpose::STANDARD.encode(encrypted)
    }

    // Simple decryption using XOR
    pub fn decrypt(&self, encrypted_data: &str) -> Result<String> {
        let encrypted = general_purpose::STANDARD.decode(encrypted_data)?;
        let decrypted: Vec<u8> = encrypted
            .iter()
            .enumerate()
            .map(|(i, &b)| b ^ self.key[i % 32])
            .collect();
        
        Ok(String::from_utf8(decrypted)?)
    }
}

// For TLS in offline mode, use self-signed certificates
pub struct TlsConfig {
    pub cert_path: String,
    pub key_path: String,
    pub use_self_signed: bool,
}

impl Default for TlsConfig {
    fn default() -> Self {
        Self {
            cert_path: "./certs/cert.pem".to_string(),
            key_path: "./certs/key.pem".to_string(),
            use_self_signed: true, // For offline development
        }
    }
}

// Security utilities
pub mod utils {
    use super::*;
    
    // Generate secure random string for sessions
    pub fn generate_session_id() -> String {
        use rand::{thread_rng, Rng};
        let mut rng = thread_rng();
        let bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
        general_purpose::STANDARD.encode(bytes)
    }
    
    // Hash sensitive data for storage
    pub fn hash_sensitive_data(data: &str, salt: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        hasher.update(salt.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let auth = AuthService::new(SecurityConfig::default());
        let password = "test_password";
        
        let hash = auth.hash_password(password).unwrap();
        assert!(auth.verify_password(password, &hash).unwrap());
        assert!(!auth.verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_jwt_tokens() {
        let auth = AuthService::new(SecurityConfig::default());
        
        let token = auth.generate_token("user123", "admin").unwrap();
        let claims = auth.validate_token(&token).unwrap();
        
        assert_eq!(claims.sub, "user123");
        assert_eq!(claims.role, "admin");
    }

    #[test]
    fn test_encryption() {
        let encryption = EncryptionService::new("test_key");
        let data = "sensitive information";
        
        let encrypted = encryption.encrypt(data);
        let decrypted = encryption.decrypt(&encrypted).unwrap();
        
        assert_eq!(data, decrypted);
    }
}
