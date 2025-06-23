use anyhow::Result;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub bcrypt_cost: u32,
    pub port: u16,
    pub upload_dir: String,
    pub max_file_size: usize,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:./prosecutor.db".to_string());
        
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "your_very_secure_jwt_secret_key_here_at_least_32_characters_long_for_security".to_string());
        
        let bcrypt_cost = env::var("BCRYPT_ROUNDS")
            .unwrap_or_else(|_| "12".to_string())
            .parse::<u32>()
            .unwrap_or(12);
        
        let port = env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .unwrap_or(8080);
        
        let upload_dir = env::var("UPLOAD_DIR")
            .unwrap_or_else(|_| "./uploads".to_string());
        
        let max_file_size = env::var("MAX_FILE_SIZE")
            .unwrap_or_else(|_| "52428800".to_string()) // 50MB default
            .parse::<usize>()
            .unwrap_or(52428800);

        Ok(Config {
            database_url,
            jwt_secret,
            bcrypt_cost,
            port,
            upload_dir,
            max_file_size,
        })
    }

    pub fn database_url_safe(&self) -> String {
        // Hide password in logs
        self.database_url
            .split('@')
            .last()
            .map(|host_part| format!("postgresql://***:***@{}", host_part))
            .unwrap_or_else(|| "***".to_string())
    }
}
