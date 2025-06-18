use prosecutor_core::{AppState, handlers::health};
use vercel_lambda::{lambda, IntoResponse, Request, RequestExt};
use std::error::Error;

#[lambda]
#[tokio::main]
async fn main(request: Request) -> Result<impl IntoResponse, Box<dyn Error>> {
    // Initialize the app state
    let state = AppState::new().await?;
    
    // For this example, just return a health check
    let health_response = health::health_check().await;
    
    Ok(serde_json::to_string(&health_response)?)
}
