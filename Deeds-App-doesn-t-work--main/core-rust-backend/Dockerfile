# Dockerfile for cross-platform development
FROM rust:1.75-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
   # libsqlite3-dev \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Python NLP packages
RUN pip3 install spacy textblob sentence-transformers
RUN python3 -m spacy download en_core_web_sm

WORKDIR /app
COPY . .

# Build Rust backend
RUN cargo build --release

# Expose ports
EXPOSE 8080

CMD ["cargo", "run", "--release"]
