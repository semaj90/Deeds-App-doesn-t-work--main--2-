# Desktop App Test Suite

## Setup

1. Start the Tauri desktop app in development mode (ensure backend is running):
   
   ```sh
   pnpm dev
   # or
   npm run dev
   ```

2. In another terminal, run Playwright tests:
   
   ```sh
   npx playwright test
   ```

## Test Files
- `e2e-basic.spec.js`: UI navigation and settings
- `tauri-commands.spec.js`: Tauri backend command invocation
- `evidence-upload.spec.js`: Drag-and-drop and file upload

Edit and expand these tests as needed for your enhanced features.
