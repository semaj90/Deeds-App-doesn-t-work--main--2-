use std::fs;

pub fn ensure_directory_exists(path: &str) -> Result<(), std::io::Error> {
    if !std::path::Path::new(path).exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}

pub fn generate_case_number() -> String {
    let now = chrono::Utc::now();
    let timestamp = now.format("%Y%m%d%H%M%S");
    let random_suffix: u32 = rand::random::<u32>() % 1000;
    format!("CASE-{}-{:03}", timestamp, random_suffix)
}
