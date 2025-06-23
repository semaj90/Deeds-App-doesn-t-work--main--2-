## Final Application README

This document provides instructions on how to run the final, production-ready application.

### Prerequisites

- Node.js and npm installed
- Docker installed and running (for the database)

### Running the Application

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Start the Database:**

   ```bash
   npm run db:start
   ```

3. **Run Migrations:**

   ```bash
   npm run db:migrate
   ```

4. **Seed the Database:**

   ```bash
   npm run db:seed
   ```

5. **Preview the Production Build:**

   ```bash
   npm run preview
   ```

### Tauri Desktop App

To build the Tauri desktop application, follow the instructions in the `desktop-app/src-tauri/README.md` file.
