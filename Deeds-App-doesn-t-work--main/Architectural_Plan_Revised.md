# Revised Plan: Social Network Application with Offline Capabilities

**Goal:** To build a social network application with user authentication, case management, evidence management, and offline support using SvelteKit, PostgreSQL, and Tauri.

**I. Architecture Overview**

*   **Frontend (SvelteKit):** Handles UI, user interaction, and API calls.
*   **Backend (SvelteKit API routes):** Manages data storage, business logic, and authentication.
*   **Database (PostgreSQL):** Stores user data, case data, evidence data, and timeline information.

**II. Core Functionality**

1.  **User Authentication:**
    *   **Registration:** `/register` (Frontend & Backend API)
    *   **Login:** `/login` (Frontend & Backend API)
    *   **Logout:** `/logout` (Frontend & Backend API)
    *   **Profile:** `/profile` (Frontend & Backend API)
2.  **Case Management:**
    *   **List Cases:** `/cases` (Frontend & Backend API - GET `/api/cases`)
    *   **Create Case:** `/cases/new` (Frontend & Backend API - POST `/api/cases`)
    *   **View Case Details:** `/cases/[id]` (Frontend & Backend API - GET `/api/cases/[id]`)
    *   **Edit Case:** `/cases/[id]/edit` (Frontend & Backend API - PUT `/api/cases/[id]`)
    *   **Delete Case:** (Backend API - DELETE `/api/cases/[id]`)
3.  **Evidence Management:**
    *   **Upload Evidence:** `/api/evidence/upload` (Backend API - POST)
    *   **View Evidence:** Display evidence on `/cases/[id]` (Frontend)
    *   **Associate Evidence with Cases:** (Backend - handled during case creation/update)
4.  **Timeline (Conceptual):**
    *   `/cases/[id]/timeline` (Frontend)
    *   `/api/timeline` (Backend API - CRUD operations)
5.  **Homepage:**
    *   `/` (Frontend) - Displays a summary of the user's cases.

**III. Technologies**

*   **Frontend:** SvelteKit, Svelte components, HTML, CSS, JavaScript
*   **Backend:** SvelteKit, Node.js, TypeScript
*   **Database:** PostgreSQL, Drizzle ORM
*   **Authentication:** Lucia v3, JWT or Cookies
*   **File Uploads:** UploadThing
*   **Deployment:** (e.g., Vercel, Netlify, Docker)
*   **Offline Capabilities:** Tauri, PWA features (Service Workers, Manifest)

**IV. Detailed Implementation Steps**

1.  **Authentication:**
    *   Integrate `Lucia v3` for session management.
    *   Implement `bcrypt` (or a similar library) for password hashing.
    *   Implement client-side storage (e.g., `localStorage`, `IndexedDB`) with encryption.
    *   Implement offline login logic.
    *   Implement synchronization mechanism.
2.  **API Endpoints:**
    *   Implement CRUD operations for cases (`/api/cases`).
    *   Implement CRUD operations for evidence (`/api/evidence`).
    *   Implement the `/api/sync` endpoint.
3.  **Frontend Components:**
    *   Create reusable components: `CaseCard`, `EvidenceUpload`.
    *   Implement the `CaseList`, `CaseDetail`, `NewCaseForm`, and `EditCaseForm` pages.
    *   Connect components to API endpoints.
4.  **File Upload:**
    *   Integrate UploadThing for file uploads.
5.  **PWA Implementation:**
    *   Create a web app manifest (`manifest.json`).
    *   Implement a service worker (`src/service-worker.ts`).
    *   Register the service worker.
    *   Implement offline functionality (caching, offline data retrieval).
    *   Implement background sync (optional).
6.  **Tauri Integration:**
    *   Use Tauri's secure storage for tokens/credentials.
    *   Ensure the authentication flow works in both web and desktop (Tauri) environments.
    *   Implement background synchronization using Tauri's background tasks.
7.  **Testing:** Thoroughly test all features, including online/offline authentication, synchronization, and file uploads.

**V. Database Schema (Simplified)**

```mermaid
erDiagram
    USERS {
        INT id PK
        VARCHAR username
        VARCHAR password
        VARCHAR email
        // Other user details
    }
    CASES {
        INT id PK
        INT user_id FK
        VARCHAR case_name
        TEXT description
        // Other case details
    }
    EVIDENCE {
        INT id PK
        INT case_id FK
        VARCHAR file_name
        VARCHAR file_path
        // Other evidence details
    }
    TIMELINE_EVENTS {
        INT id PK
        INT case_id FK
        TIMESTAMP event_time
        TEXT description
        // Other event details
    }
    USERS ||--o{ CASES : "owns"
    CASES ||--o{ EVIDENCE : "has"
    CASES ||--o{ TIMELINE_EVENTS : "has"