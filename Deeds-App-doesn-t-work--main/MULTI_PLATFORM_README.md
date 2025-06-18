# 🏛️ Prosecutor Case Management System - Multi-Platform Architecture

A comprehensive prosecutor case management system that supports **three deployment targets**:

1. 🌐 **Web App** (Vercel deployment)
2. 🖥️ **Desktop App** (Tauri-based .exe)
3. 📱 **Mobile App** (Flutter iOS/Android)

## 🏗️ Project Structure

```
my-prosecutor-app/
├── 🦀 core-rust-backend/           # Shared Rust core library
│   ├── src/
│   │   ├── lib.rs                  # Main library entry point
│   │   ├── auth_simple.rs          # Simple authentication (Windows-compatible)
│   │   ├── database.rs             # PostgreSQL & SQLite support
│   │   ├── models/                 # Data models
│   │   ├── handlers/               # API handlers
│   │   └── ...
│   └── Cargo.toml                  # Core dependencies
│
├── 🌐 web-app/                     # Vercel web deployment
│   ├── sveltekit-frontend/         # SvelteKit UI
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   ├── api/                        # Vercel serverless functions (Rust)
│   │   ├── health.rs
│   │   └── Cargo.toml
│   └── vercel.json                 # Vercel configuration
│
├── 🖥️ desktop-app/                 # Tauri desktop application
│   ├── sveltekit-frontend/         # Same SvelteKit UI (copied)
│   ├── src-tauri/                  # Tauri Rust backend
│   │   ├── src/main.rs             # Tauri entry point
│   │   ├── Cargo.toml              # Tauri dependencies
│   │   ├── tauri.conf.json         # Tauri configuration
│   │   └── build.rs
│   └── package.json                # Tauri build scripts
│
└── 📱 mobile-app/                  # Flutter mobile application
    ├── flutter_project/            # Flutter app
    │   ├── lib/main.dart
    │   ├── pubspec.yaml
    │   └── ...
    └── native_bindings/            # Rust FFI for Flutter
        ├── src/lib.rs              # FFI bindings
        └── Cargo.toml              # FFI dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Rust** (latest stable)
- **Node.js** 18+
- **Flutter** 3.10+ (for mobile)
- **PostgreSQL** (optional, SQLite works too)

### 1. 🦀 Core Backend Setup

```bash
cd core-rust-backend
cargo check  # Verify it compiles
```

### 2. 🌐 Web App (Vercel)

```bash
cd web-app/sveltekit-frontend
npm install
npm run dev  # Development server

# Deploy to Vercel
vercel --prod
```

### 3. 🖥️ Desktop App (Tauri)

```bash
cd desktop-app

# Install dependencies
npm install
npm run install:frontend

# Development
npm run tauri:dev

# Build executable
npm run tauri:build  # Creates .exe in src-tauri/target/release/bundle/
```

### 4. 📱 Mobile App (Flutter)

```bash
cd mobile-app

# Build FFI bindings
cd native_bindings
cargo build

# Flutter setup
cd flutter_project
flutter pub get
flutter run  # For development

# Build for release
flutter build apk      # Android
flutter build ios      # iOS (requires Xcode)
```

## 🎯 Features by Platform

### 🌐 Web App
- ✅ Full SvelteKit UI
- ✅ PostgreSQL database
- ✅ Secure authentication
- ✅ File uploads
- ✅ Real-time updates
- 🚧 AI features (when ready)

### 🖥️ Desktop App  
- ✅ Offline-first operation
- ✅ Local SQLite database
- ✅ File system access
- ✅ Desktop notifications
- 🚧 Local LLM integration
- 🚧 Auto-sync with web

### 📱 Mobile App
- ✅ Native iOS/Android UI
- ✅ Offline data storage
- ✅ Camera integration
- ✅ Push notifications
- 🚧 Biometric authentication
- 🚧 Field evidence capture

## 🔧 Development Workflow

### Shared Core Development
All business logic lives in `core-rust-backend/`. Changes here benefit all platforms:

```bash
cd core-rust-backend
cargo test        # Run tests
cargo check       # Quick compile check
cargo build       # Full build
```

### Frontend Development
The SvelteKit frontend is shared between web and desktop:

```bash
cd web-app/sveltekit-frontend  # or desktop-app/sveltekit-frontend
npm run dev
```

### Platform-Specific Features

**Web (Vercel Functions):**
```bash
cd web-app/api
cargo check
```

**Desktop (Tauri Commands):**
```bash
cd desktop-app/src-tauri
cargo check
```

**Mobile (FFI Bindings):**
```bash
cd mobile-app/native_bindings
cargo check
```

## 🗄️ Database Strategy

- **Web**: PostgreSQL (production) or SQLite (development)
- **Desktop**: SQLite (offline-first)
- **Mobile**: SQLite (via Flutter sqflite)

All platforms use the same schema through the core Rust library.

## 🤖 AI & LLM Integration

The system is designed for local LLM integration:

1. **Model Download**: Desktop app downloads GGUF models on first run
2. **Local Inference**: Uses `candle` crate for fast Rust-based inference
3. **Offline Operation**: No internet required after initial setup
4. **Features**: Auto-tagging, case summarization, evidence analysis

*Note: AI features currently commented out due to Windows build complexity. Will be re-enabled once `ring` crate issues are resolved.*

## 📦 Deployment

### Web App → Vercel
```bash
cd web-app
vercel --prod
```

### Desktop App → Executable
```bash
cd desktop-app
npm run tauri:build
# Find .exe in src-tauri/target/release/bundle/msi/
```

### Mobile App → App Stores
```bash
cd mobile-app/flutter_project
flutter build appbundle  # Android Play Store
flutter build ios        # iOS App Store
```

## 🔐 Security & Authentication

- **Web**: JWT tokens, bcrypt password hashing
- **Desktop**: Local session storage, encrypted database
- **Mobile**: Biometric auth + secure storage

## 🧪 Testing

```bash
# Core backend
cd core-rust-backend && cargo test

# Web frontend
cd web-app/sveltekit-frontend && npm test

# Desktop
cd desktop-app && npm run tauri:test

# Mobile
cd mobile-app/flutter_project && flutter test
```

## 📋 Next Steps

1. ✅ **Basic Structure**: Complete
2. 🔄 **Core Backend**: Implement remaining handlers
3. 🔄 **AI Integration**: Re-enable when Windows build issues resolved
4. 🔄 **Mobile FFI**: Connect Flutter to Rust bindings
5. 🔄 **Sync Logic**: Implement offline/online data sync
6. 🔄 **Testing**: Add comprehensive test coverage

## 🤝 Contributing

1. Core backend changes go in `core-rust-backend/`
2. UI changes go in `web-app/sveltekit-frontend/` (then copy to desktop)
3. Platform-specific features go in their respective directories
4. Always test across all three platforms

---

**🎯 Goal**: One codebase, three platforms, maximum code reuse, excellent user experience everywhere!
