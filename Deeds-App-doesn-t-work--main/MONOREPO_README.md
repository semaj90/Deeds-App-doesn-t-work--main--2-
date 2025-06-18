# Prosecutor Case Management App - Monorepo

A multi-platform prosecutor case management application with shared Rust backend and platform-specific frontends.

## 🏗️ Architecture Overview

```
prosecutor-app-monorepo/
├── core-rust-backend/         # Shared Rust backend library
├── web-app/                   # Vercel web application
│   ├── sveltekit-frontend/    # SvelteKit frontend
│   └── api/                   # Rust serverless functions
├── desktop-app/               # Tauri desktop application
│   ├── sveltekit-frontend/    # Shared SvelteKit frontend
│   └── src-tauri/             # Tauri Rust backend
├── mobile-app/                # Flutter mobile application
│   ├── flutter_project/       # Flutter frontend
│   └── native_bindings/       # Rust FFI bindings
└── scripts/                   # Development & build scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm 8+**
- **Rust** (install from [rustup.rs](https://rustup.rs/))
- **Docker** (optional, for PostgreSQL)
- **Flutter** (for mobile development)

### Setup

Run the setup script to install all dependencies and build the core backend:

```powershell
npm run setup
```

Or manually:

```powershell
npm install
npm run install:all
npm run rust:build
```

## 🎯 Development Commands

### Quick Start Development

```powershell
# Start web app development (default)
npm run dev
npm run web:dev

# Start desktop app development
npm run desktop:dev

# Start mobile app development
npm run mobile:dev
```

### Platform-Specific Development

#### Web App (Vercel)
```powershell
npm run web:dev         # Start development server
npm run web:build       # Build for production
npm run web:preview     # Preview production build
npm run web:vercel      # Deploy to Vercel
```

#### Desktop App (Tauri)
```powershell
npm run desktop:dev     # Start Tauri development
npm run desktop:build   # Build desktop executable
```

#### Mobile App (Flutter)
```powershell
npm run mobile:dev      # Start Flutter development
npm run mobile:build    # Build Android APK
npm run mobile:build:ios # Build iOS app
```

## 🦀 Rust Backend Commands

### Core Backend
```powershell
npm run rust:build      # Build all Rust components
npm run rust:test       # Run Rust tests
npm run rust:check      # Check Rust code
```

### Platform-Specific Rust
```powershell
npm run rust:web        # Build web API functions
npm run rust:tauri      # Build Tauri backend
npm run rust:mobile     # Build FFI bindings
```

## 🗄️ Database Commands

```powershell
npm run db:start        # Start PostgreSQL (Docker)
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate new migrations
npm run db:seed         # Seed database with test data
npm run db:studio       # Open Drizzle Studio
npm run db:reset        # Reset database
```

## 🏗️ Build Commands

```powershell
npm run build           # Build all platforms
npm run build:web       # Build web app only
npm run build:desktop   # Build desktop app only
npm run build:mobile    # Build mobile app only
npm run build:all       # Build all platforms (same as build)
```

## 🧪 Testing & Quality

```powershell
npm run test            # Run all tests
npm run test:rust       # Run Rust tests
npm run test:web        # Run web app tests
npm run test:desktop    # Run desktop app tests

npm run check           # Type check all platforms
npm run check:web       # Type check web app
npm run check:desktop   # Type check desktop app

npm run format          # Format all code
npm run lint            # Lint all code
```

## 📦 Package Management

This project uses npm workspaces for dependency management:

```powershell
npm run install:all     # Install all dependencies
npm run install:web     # Install web dependencies
npm run install:desktop # Install desktop dependencies
npm run install:mobile  # Install mobile dependencies
```

## 🌐 Deployment

### Web App (Vercel)
1. Connect your repository to Vercel
2. Set the root directory to `web-app/sveltekit-frontend`
3. Deploy using: `npm run web:vercel`

### Desktop App
1. Build the executable: `npm run desktop:build`
2. Find the executable in `desktop-app/src-tauri/target/release/`

### Mobile App
1. Build APK: `npm run mobile:build`
2. Find APK in `mobile-app/flutter_project/build/app/outputs/flutter-apk/`

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective frontend directories:

- `web-app/sveltekit-frontend/.env`
- `desktop-app/sveltekit-frontend/.env`

### Database Configuration

The app supports both PostgreSQL (production/web) and SQLite (local/desktop):

- **PostgreSQL**: Configure in `docker-compose.yml` and `.env`
- **SQLite**: Automatically used for desktop app (no config needed)

## 🏗️ Development Workflow

### Adding New Features

1. **Backend Logic**: Add to `core-rust-backend/src/`
2. **Web Frontend**: Update `web-app/sveltekit-frontend/src/`
3. **Desktop Frontend**: Update `desktop-app/sveltekit-frontend/src/`
4. **Mobile Frontend**: Update `mobile-app/flutter_project/lib/`

### Shared Frontend Components

The SvelteKit frontend is shared between web and desktop. Changes to:
- `web-app/sveltekit-frontend/src/` → Web-specific changes
- `desktop-app/sveltekit-frontend/src/` → Desktop-specific changes

For truly shared components, consider creating a shared library or keeping components generic.

### Database Migrations

1. Make schema changes in `drizzle/schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**: Run `npm run rust:check` to check for Rust errors
2. **Package Issues**: Try `npm run install:all` to reinstall dependencies
3. **Database Issues**: Restart Docker with `npm run db:start`
4. **Tauri Issues**: Ensure Rust and system dependencies are installed

### Platform-Specific Issues

#### Windows
- Use PowerShell for best compatibility
- Ensure Windows Subsystem for Linux (WSL) is not required

#### Desktop App
- Ensure system dependencies for Tauri are installed
- Check `desktop-app/src-tauri/tauri.conf.json` for configuration

#### Mobile App
- Ensure Flutter is properly installed and configured
- Check Android SDK and Xcode (for iOS) setup

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Flutter Documentation](https://flutter.dev/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contributing

1. Follow the existing project structure
2. Test all platforms before committing
3. Update documentation for new features
4. Use the provided scripts for development and building
