use anyhow::Result;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub qdrant_url: String,
    pub jwt_secret: String,
    pub bcrypt_cost: u32,
    pub port: u16,
    pub upload_dir: String,
    pub max_file_size: usize,
    pub llm_models_dir: String,
    pub llm_uploads_dir: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5433/prosecutor_db".to_string());
        
        let qdrant_url = env::var("QDRANT_URL")
            .unwrap_or_else(|_| "http://localhost:6333".to_string());
        
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

        let llm_models_dir = env::var("LLM_MODELS_DIR")
            .unwrap_or_else(|_| "./llm-models".to_string());
        
        let llm_uploads_dir = env::var("LLM_UPLOADS_DIR")
            .unwrap_or_else(|_| "./llm-uploads".to_string());

        Ok(Config {
            database_url,
            qdrant_url,
            jwt_secret,
            bcrypt_cost,
            port,
            upload_dir,
            max_file_size,
            llm_models_dir,
            llm_uploads_dir,
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
