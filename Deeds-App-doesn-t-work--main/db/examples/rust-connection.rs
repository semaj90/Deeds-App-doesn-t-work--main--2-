// Example: Rust/Tauri connection to shared PostgreSQL database
// Add this to your Cargo.toml:
// [dependencies]
// tokio-postgres = "0.7"
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"
// uuid = { version = "1.0", features = ["v4"] }

use tokio_postgres::{connect, NoTls, Client, Error};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Database connection string - matches shared database
const DATABASE_URL: &str = "host=localhost user=postgres password=postgres dbname=prosecutor_app";

#[derive(Debug, Serialize, Deserialize)]
pub struct Case {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub role: String,
    pub is_active: bool,
}

pub struct Database {
    client: Client,
}

impl Database {
    // Connect to shared PostgreSQL database
    pub async fn connect() -> Result<Self, Error> {
        let (client, connection) = connect(DATABASE_URL, NoTls).await?;
        
        // Spawn connection handler
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Database connection error: {}", e);
            }
        });

        Ok(Database { client })
    }

    // Get all cases
    pub async fn get_cases(&self) -> Result<Vec<Case>, Error> {
        let rows = self.client.query(
            "SELECT id, title, description, status, priority, created_at, updated_at 
             FROM cases 
             ORDER BY created_at DESC",
            &[]
        ).await?;

        let mut cases = Vec::new();
        for row in rows {
            cases.push(Case {
                id: row.get("id"),
                title: row.get("title"),
                description: row.get("description"),
                status: row.get("status"),
                priority: row.get("priority"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(cases)
    }

    // Create new case
    pub async fn create_case(&self, title: &str, description: Option<&str>) -> Result<Case, Error> {
        let id = Uuid::new_v4();
        let row = self.client.query_one(
            "INSERT INTO cases (id, title, description, status, priority, created_at, updated_at)
             VALUES ($1, $2, $3, 'open', 'medium', NOW(), NOW())
             RETURNING id, title, description, status, priority, created_at, updated_at",
            &[&id, &title, &description]
        ).await?;

        Ok(Case {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            status: row.get("status"),
            priority: row.get("priority"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }

    // Get user by email
    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>, Error> {
        let rows = self.client.query(
            "SELECT id, email, name, role, is_active FROM users WHERE email = $1",
            &[&email]
        ).await?;

        if let Some(row) = rows.first() {
            Ok(Some(User {
                id: row.get("id"),
                email: row.get("email"),
                name: row.get("name"),
                role: row.get("role"),
                is_active: row.get("is_active"),
            }))
        } else {
            Ok(None)
        }
    }

    // Health check
    pub async fn health_check(&self) -> Result<bool, Error> {
        let row = self.client.query_one("SELECT 1 as status", &[]).await?;
        Ok(row.get::<_, i32>("status") == 1)
    }
}

// Tauri command examples
#[tauri::command]
pub async fn get_cases_command() -> Result<Vec<Case>, String> {
    let db = Database::connect().await.map_err(|e| e.to_string())?;
    let cases = db.get_cases().await.map_err(|e| e.to_string())?;
    Ok(cases)
}

#[tauri::command]
pub async fn create_case_command(title: String, description: Option<String>) -> Result<Case, String> {
    let db = Database::connect().await.map_err(|e| e.to_string())?;
    let case = db.create_case(&title, description.as_deref()).await.map_err(|e| e.to_string())?;
    Ok(case)
}

#[tauri::command]
pub async fn health_check_command() -> Result<bool, String> {
    let db = Database::connect().await.map_err(|e| e.to_string())?;
    let is_healthy = db.health_check().await.map_err(|e| e.to_string())?;
    Ok(is_healthy)
}

// Usage in main.rs:
/*
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_cases_command,
            create_case_command,
            health_check_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
*/
