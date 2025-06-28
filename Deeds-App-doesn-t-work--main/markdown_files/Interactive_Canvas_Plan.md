# Interactive Canvas Implementation Plan

This plan outlines the steps to develop an interactive canvas for the Deeds-App, incorporating evidence handling, advanced editing tools, and AI integration with Qdrant for auto-tagging and summarization, now leveraging **Fabric.js**.

## I. Core Canvas Development (Frontend - SvelteKit with Fabric.js)

**Goal:** Establish a robust interactive canvas with fundamental object manipulation capabilities using Fabric.js.

1.  **Canvas Library Choice:** Implement the canvas using **Fabric.js**. This library is lightweight, offers a full feature set for interactive objects (drag/drop, scale, rotate, group, text editing), and provides persistent JSON serialization for SSR.
2.  **Canvas Initialization:**
    *   Create a new Svelte component, `CanvasEditor.svelte`, in [`Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/lib/components/`](Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/lib/components/).
    *   Initialize a Fabric.js `Canvas` instance within this component using `onMount`.
    *   Integrate it into a new route: [`Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/routes/interactive-canvas/+page.svelte`](Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/routes/interactive-canvas/+page.svelte).
3.  **Object Handling (Uploaded Evidence):**
    *   **Display Evidence:** When evidence (images, PDFs, .txt) is uploaded, display it as Fabric.js `Image` or `Textbox` objects on the canvas. For PDFs, a server-side PDF parser (e.g., `pdf-lib` or `pdf-parse` in the backend) will convert pages to images or extract text, which can then be loaded onto the canvas.
    *   **Drag and Drop:** Fabric.js inherently supports drag-and-drop for its objects.
    *   **Selection and Transformation:** Fabric.js provides built-in capabilities for selection, resizing, rotation, and scaling of objects.
    *   **Editing Options on Hover (Images):** On hover over an image, display a small, context-sensitive toolbar or menu with "editing options" (e.g., crop, adjust brightness/contrast, apply filters). These operations will modify the Fabric.js image object.
    *   **Auto-Populate Form:** Upon evidence upload (PDF, .txt, image), the NLP service will extract key entities and relationships (e.g., "who," "what," "why," "how"). This extracted data will be used to auto-populate a form on the canvas, either as pre-filled Fabric.js `Textbox` objects (acting as inline fields) or as interactive dropdowns linked to the canvas.
4.  **Native Canvas Toolbar:**
    *   Design and implement a Svelte component for the canvas-native toolbar, interacting with the Fabric.js canvas instance.
    *   **Page Generation:** Add a "New Page" button. This will dynamically increase the canvas height (Fabric.js `canvas.setHeight()`) and add a new visual "page" boundary (e.g., a Fabric.js `Rect` object) to the canvas.
    *   **Text Editing Tools:**
        *   **Font Size:** Buttons/dropdown for text sizes (Small, Medium, Large, Extra-Large) that modify the `fontSize` property of selected Fabric.js `Textbox` objects.
        *   **Standard Fonts:** Ensure text elements use standard, readable fonts by setting the `fontFamily` property.
        *   **Highlighting with Style Change:** Allow users to select text within a Fabric.js `Textbox`. On selection, provide options to:
            *   **Drop-down View:** Convert the highlighted text into a collapsible section (e.g., by creating a new Fabric.js `Group` containing the text and a toggle icon, or by dynamically adjusting the `height` and `visible` properties of the text object).
            *   **Styling:** Apply different styles (e.g., `backgroundColor`, `stroke` for border, `padding` for indentation) to the highlighted text or the `Textbox` object itself.
    *   **Marker Tool:** Implement a drawing mode using Fabric.js's `isDrawingMode` and `freeDrawingBrush` properties, allowing users to select different `strokeWidth` (pen sizes) and `stroke` colors.
    *   **Scaling Tools:** Buttons/controls for explicit scaling (expand, make smaller) and rotation, manipulating the `scaleX`, `scaleY`, and `angle` properties of selected Fabric.js objects.
    *   **Combine Elements:** A tool/mode to group selected canvas elements using Fabric.js `fabric.Group` for combined manipulation (drag, scale, rotate).
5.  **Interactive Pages:**
    *   **Typing:** Allow users to type directly into designated text areas within the canvas pages by enabling `editable` on Fabric.js `Textbox` objects.
    *   **Expandable Pages:** Implement logic to dynamically resize canvas pages (increase `canvas.height`) as text content grows within `Textbox` objects or as new evidence/objects are added, ensuring content remains visible.
    *   **Differentiate Content:** Use different default text colors or background fills for Fabric.js `Textbox` objects to visually distinguish between "evidence" (content extracted from uploaded files, e.g., light gray text) and "newly created stuff" (user-typed text or annotations, e.g., black text). This will be a lightweight visual cue.

## II. AI Integration (Backend - Python NLP Service & Qdrant)

**Goal:** Integrate Qdrant for efficient vector search and auto-tagging, and enable AI summarization.
integrate loki.js and fuse.js? for cacching of qdrant tagging. (for web-app, desktop-app, mobile-app all use dockersetup. explain the difference)
1.  **Qdrant Integration (Backend):**
    *   **Vector Database Setup:** Ensure Qdrant is running and accessible from the Python NLP service.
    *   **Indexing Evidence Embeddings:** Modify the evidence upload process (`Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/routes/api/evidence/upload/+server.ts`) to send the generated embeddings to Qdrant for indexing. Each evidence piece will be a document in Qdrant, with its embedding and relevant metadata (caseId, fileType, original content hash, etc.).
    *   **Auto-Tagging:**
        *   When new text content is added to a canvas page (Fabric.js `Textbox`) or evidence is uploaded, generate embeddings for that content via the Python NLP service.
        *   Perform a similarity search in Qdrant against a collection of predefined tags or relevant concepts.
        *   Return top-k similar tags to the frontend. These tags can then be associated with the canvas object.
2.  **AI Summary Feature:**
    *   **Backend Endpoint:** Create a new API endpoint (e.g., [`Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/routes/api/ai/summarize/+server.ts`](Deeds-App-doesn-t-work--main/web-app/sveltekit-frontend/src/routes/api/ai/summarize/+server.ts)) that accepts text content.
    *   **NLP Service Integration:** This endpoint will call the Python NLP service (e.g., `http://localhost:8000/summarize`) to generate an AI summary of the provided text.
    *   **Frontend Integration:**
        *   Implement an "AI button" in the bottom right corner of the canvas.
        *   On hover or right-click of text areas/pages or selected objects on the canvas, enable the "AI button".
        *   When clicked, send the content of the selected text area/page/object to the new summarization endpoint.
        *   Display the AI-generated summary to the user (e.g., in a tooltip or a modal).

#### III. Data Persistence and State Management

**Goal:** Ensure canvas state and object properties are saved and loaded correctly, with a Drizzle schema migration.

1.  **Canvas State Schema (Drizzle Migration):**
    *   Define a new Drizzle schema file (e.g., `db/schema/canvas.ts`) for `canvasStates`.
    *   The `canvasStates` table will store the full Fabric.js canvas JSON (`canvas.toJSON()`) and potentially an `imagePreview` (`canvas.toDataURL()`).
    *   Each canvas element/object will be tagged with a `caseId` (linking to the case it belongs to) and a `uniqueId` (for individual identification within the canvas). This will be part of the Fabric.js object's custom properties.
    *   A Drizzle migration will be created to add this new schema to the database.
2.  **Save/Load Functionality (SSR):**
    *   Implement SvelteKit API endpoints:
        *   `/api/canvas/save`: Accepts the canvas JSON and image preview (optional) via POST and saves it to the `canvasStates` table.
        *   `/api/canvas/load`: Retrieves the canvas JSON for a given `caseId` (or canvas ID) and returns it.
    *   Integrate these with the frontend to allow users to save their work and resume later. The `CanvasEditor.svelte` component will load the saved JSON on initialization.
3.  **Real-time Updates (Optional but Recommended):** Consider using WebSockets for real-time collaboration or saving changes as they happen, especially if multiple users might interact with the same canvas.

#### IV. UI/UX Considerations

**Goal:** Ensure a smooth and intuitive user experience.

1.  **Responsive Design:** Ensure the canvas and its toolbar are responsive and usable across different screen sizes.
2.  **Feedback Mechanisms:** Provide visual feedback for actions (e.g., object selection, drag-and-drop, loading AI summaries).
3.  **Error Handling:** Gracefully handle errors during file uploads, AI processing, and data persistence.
4.  **Lightweight Implementation:** Prioritize efficient rendering and minimal resource usage for a smooth user experience, leveraging Fabric.js's performance.

#### V. High-Level Architecture Diagram

```mermaid
graph TD
    A[User Interface - SvelteKit Frontend] --> B(CanvasEditor.svelte Component);
    B -- "Fabric.js API" --> C(Fabric.js Canvas Instance);
    C --> D{Canvas Toolbar};
    C --> E{Canvas Objects};
    E --> E1[Uploaded Evidence (Images/PDFs)];
    E --> E2[Text Pages (User-created)];
    E --> E3[Drawings];
    D --> C;
    E --> C;

    B -- "Upload Evidence" --> F[SvelteKit API: /api/evidence/upload];
    F -- "Save File" --> G[Local File System];
    F -- "Extract Metadata & Generate Embedding" --> H[Python NLP Service];
    H -- "Store Embedding & Metadata" --> I[Qdrant Vector DB];
    F -- "Store Evidence Metadata" --> J[PostgreSQL DB];
    H -- "Auto-populate Form Data" --> B;

    B -- "Request AI Summary" --> K[SvelteKit API: /api/ai/summarize];
    K -- "Request Summary" --> H;
    H -- "Return Summary" --> K;
    K -- "Display Summary" --> B;

    B -- "Auto-Tagging (on content change)" --> L[SvelteKit API: /api/ai/autotag];
    L -- "Generate Embedding & Search Qdrant" --> H;
    H -- "Return Tags" --> L;
    L -- "Apply Tags" --> B;

    B -- "Save Canvas State" --> M[SvelteKit API: /api/canvas/save];
    M -- "Store Canvas Data" --> J;
    B -- "Load Canvas State" --> N[SvelteKit API: /api/canvas/load];
    N -- "Retrieve Canvas Data" --> J;
    N -- "Render Canvas" --> B;
```

#### VI. Next Steps

The plan is now finalized and incorporates all your feedback. I am ready to proceed with the implementation.