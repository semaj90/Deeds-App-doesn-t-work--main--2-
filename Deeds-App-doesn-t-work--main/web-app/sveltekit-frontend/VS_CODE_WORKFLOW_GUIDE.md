# Visual Studio Code Workflow Guide - SvelteKit Transform Sync Development

## Overview

This guide provides step-by-step instructions for developing and extending the SvelteKit transform sync system in Visual Studio Code. It covers the complete development workflow from setup to advanced features implementation.

## Prerequisites

- Visual Studio Code with these essential extensions:
  - Svelte for VS Code
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - PostCSS Language Support
  - GitLens
- Node.js 18+ and npm
- Git for version control

## Project Setup Workflow

### Step 1: Environment Setup
```bash
# Open terminal in VS Code (Ctrl+`)
cd path/to/your/project
npm install

# Verify all dependencies are installed
npm list fabric mathjs gl-matrix svelte-dnd-action
```

### Step 2: VS Code Workspace Configuration
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "svelte.enable-ts-plugin": true,
  "emmet.includeLanguages": {
    "svelte": "html"
  },
  "prettier.documentSelectors": ["**/*.svelte"],
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  }
}
```

### Step 3: Create VS Code Tasks
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev server",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      },
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "source": "ts",
        "fileLocation": ["relative", "${workspaceFolder}"]
      }
    },
    {
      "label": "type check",
      "type": "shell",
      "command": "npm",
      "args": ["run", "check"],
      "group": "test"
    },
    {
      "label": "build",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Development Workflow

### Step 4: Start Development Environment
1. **Open Terminal** (Ctrl+`)
2. **Run Dev Task**: Ctrl+Shift+P → "Tasks: Run Task" → "dev server"
3. **Open Browser**: VS Code will automatically open or use Ctrl+Click on the localhost URL

### Step 5: Transform Sync Development

#### A. Working with the Transform Store

1. **Open Transform Sync Store**: `src/lib/stores/transform-sync.ts`
2. **Key Areas to Understand**:
   ```typescript
   // Core stores - these are reactive and auto-update UI
   export const canvasInstance = writable<fabric.Canvas | null>(null);
   export const currentState = writable<CanvasState | null>(null);
   export const undoStack = writable<CanvasState[]>([]);
   
   // Matrix utilities - for transform calculations
   export const MatrixUtils = {
     translate(x: number, y: number): number[][],
     rotate(angle: number): number[][],
     scale(sx: number, sy: number): number[][]
   };
   ```

3. **Add Custom Transforms**:
   ```typescript
   // Add to helpers object
   export const helpers = {
     // Existing helpers...
     
     // New custom transform
     skew(objectId: string, skewX: number, skewY: number): void {
       const matrix = [
         [1, Math.tan(skewX), 0],
         [Math.tan(skewY), 1, 0],
         [0, 0, 1]
       ];
       const operation = TransformManager.createTransform('skew', objectId, matrix);
       TransformManager.queueTransform(operation);
     }
   };
   ```

#### B. Creating New UI Components

1. **Component Template** (save as `src/lib/components/YourComponent.svelte`):
   ```svelte
   <script lang="ts">
     import { createEventDispatcher } from 'svelte';
     
     // Props
     export let variant: 'primary' | 'secondary' = 'primary';
     export let disabled: boolean = false;
     
     // Additional classes
     let className: string = '';
     export { className as class };
     
     const dispatch = createEventDispatcher();
     
     function handleClick() {
       if (disabled) return;
       dispatch('click');
     }
   </script>
   
   <div 
     class="your-component {variant} {className}"
     class:disabled
     on:click={handleClick}
     {...$$restProps}
   >
     <slot />
   </div>
   
   <style>
     .your-component {
       /* Use theme variables */
       background-color: var(--color-primary);
       border: 1px solid var(--color-border);
       padding: var(--spacing-md);
       border-radius: var(--border-radius-md);
       transition: all var(--transition-fast);
     }
     
     .your-component:hover {
       background-color: var(--color-hover);
     }
     
     .disabled {
       opacity: 0.5;
       cursor: not-allowed;
     }
   </style>
   ```

2. **IntelliSense Setup**: VS Code will automatically provide autocompletion for:
   - Svelte syntax
   - TypeScript types
   - CSS custom properties
   - Component props

#### C. Canvas Editor Integration

1. **Open Canvas Editor**: `src/lib/components/CanvasEditor.svelte`
2. **Add New Tools**:
   ```svelte
   <script lang="ts">
     // Add to existing tools
     function addCustomShape() {
       const rect = new fabric.Rect({
         left: 100,
         top: 100,
         width: 100,
         height: 100,
         fill: 'transparent',
         stroke: '#333',
         strokeWidth: 2
       });
       
       // Assign unique ID for transform tracking
       (rect as any).id = `shape_${Date.now()}`;
       
       canvas.add(rect);
       canvas.setActiveObject(rect);
       canvas.renderAll();
     }
   </script>
   
   <!-- Add to toolbar -->
   <button 
     class="tool-btn"
     on:click={addCustomShape}
     title="Add Rectangle"
   >
     ⬛
   </button>
   ```

### Step 6: Theme Development

#### A. Adding New Theme Variables
1. **Open Theme File**: `src/lib/styles/theme.css`
2. **Add Variables**:
   ```css
   :root {
     /* Add custom colors */
     --color-custom-primary: #your-color;
     --color-custom-secondary: #your-color;
     
     /* Add custom spacing */
     --spacing-custom: 1.25rem;
   }
   ```

#### B. Creating Component-Specific Styles
```css
/* Component-specific variables */
.your-component {
  --component-bg: var(--color-primary);
  --component-border: var(--color-border);
  --component-text: var(--color-text);
}

/* Dark theme overrides */
[data-theme="gothic"] .your-component {
  --component-bg: var(--color-gothic-primary);
  --component-border: var(--color-gothic-border);
}
```

## Debugging Workflow

### Step 7: VS Code Debugging Setup

#### A. Browser DevTools Integration
1. **Install Debugger Extension**: "JavaScript Debugger (Nightly)"
2. **Create Launch Configuration** (`.vscode/launch.json`):
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Launch Chrome",
         "request": "launch",
         "type": "node",
         "program": "${workspaceFolder}/node_modules/.bin/vite",
         "args": ["dev", "--host", "localhost", "--port", "5173"],
         "console": "integratedTerminal",
         "runtimeExecutable": "node"
       }
     ]
   }
   ```

#### B. Transform Sync Debugging
1. **Add Debug Breakpoints** in transform-sync.ts:
   ```typescript
   export const TransformManager = {
     async applyTransform(canvas: fabric.Canvas, operation: TransformOperation) {
       console.log('Applying transform:', operation); // Debug log
       debugger; // Breakpoint for VS Code debugger
       
       const obj = canvas.getObjects().find(o => (o as any).id === operation.objectId);
       // ... rest of function
     }
   };
   ```

2. **Use Console for Live Debugging**:
   ```javascript
   // In browser console
   window.__CANVAS_DEBUG__ = true;
   
   // Access stores from console
   import { get } from 'svelte/store';
   import { currentState } from './stores/transform-sync.js';
   console.log(get(currentState));
   ```

## Testing Workflow

### Step 8: Component Testing

#### A. Manual Testing Checklist
- [ ] Transform operations work correctly
- [ ] Undo/redo functions properly
- [ ] Canvas state saves and loads
- [ ] UI components respond to interactions
- [ ] Theme switching works
- [ ] Keyboard shortcuts function
- [ ] Mobile responsiveness

#### B. Performance Testing
1. **Monitor Performance** in VS Code terminal:
   ```bash
   # Watch for memory usage
   npm run dev -- --debug
   
   # Check bundle size
   npm run build
   ```

2. **Cache Performance Testing**:
   ```typescript
   // Add to transform-sync.ts for debugging
   setInterval(() => {
     const stats = CacheManager.getStats();
     console.log('Cache stats:', stats);
   }, 5000);
   ```

## Advanced Development

### Step 9: AI Integration Development

#### A. Backend API Integration
1. **Create API Endpoints**: `src/routes/api/ai/new-feature/+server.ts`
   ```typescript
   import { json } from '@sveltejs/kit';
   import type { RequestHandler } from './$types';
   
   export const POST: RequestHandler = async ({ request }) => {
     const { content, options } = await request.json();
     
     // AI processing logic
     const result = await processWithAI(content, options);
     
     return json({ success: true, result });
   };
   ```

2. **Frontend Integration**:
   ```typescript
   // Add to CanvasEditor.svelte
   async function processWithAI() {
     const response = await fetch('/api/ai/new-feature', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ content: getCanvasContent() })
     });
     
     const result = await response.json();
     // Handle AI result
   }
   ```

### Step 10: Qdrant Integration Setup

#### A. Vector Database Integration
1. **Install Qdrant Client**:
   ```bash
   npm install @qdrant/js-client-rest
   ```

2. **Create Embedding Service**: `src/lib/services/embeddings.ts`
   ```typescript
   import { QdrantClient } from '@qdrant/js-client-rest';
   
   const client = new QdrantClient({ url: process.env.QDRANT_URL });
   
   export async function storeCanvasEmbedding(canvasData: any) {
     const embedding = await generateEmbedding(canvasData);
     
     await client.upsert('canvas_collection', {
       points: [{
         id: canvasData.id,
         vector: embedding,
         payload: { metadata: canvasData.metadata }
       }]
     });
   }
   ```

## VS Code Shortcuts for Productivity

### Essential Shortcuts
- **Ctrl+Shift+P**: Command Palette
- **Ctrl+`**: Toggle Terminal
- **Ctrl+Shift+E**: Explorer
- **Ctrl+Shift+F**: Global Search
- **F2**: Rename Symbol
- **Ctrl+.**: Quick Fix
- **Alt+Shift+F**: Format Document
- **Ctrl+K, Ctrl+C**: Add Line Comment
- **Ctrl+/**: Toggle Line Comment

### Svelte-Specific Shortcuts
- **Ctrl+Space**: IntelliSense
- **F12**: Go to Definition
- **Shift+F12**: Find All References
- **Ctrl+Shift+O**: Go to Symbol

## File Organization Best Practices

### Project Structure
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI elements
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── stores/             # Svelte stores
│   ├── services/           # API and external services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── styles/             # CSS and theme files
├── routes/                 # SvelteKit pages and API routes
└── app.html               # HTML template
```

### Naming Conventions
- **Components**: PascalCase (e.g., `CanvasEditor.svelte`)
- **Stores**: camelCase (e.g., `transform-sync.ts`)
- **Types**: PascalCase with Type suffix (e.g., `CanvasStateType`)
- **Utils**: camelCase (e.g., `matrix-utils.ts`)

## Deployment Workflow

### Step 11: Build and Deploy

#### A. Build Process
```bash
# Type checking
npm run check

# Production build
npm run build

# Preview build
npm run preview
```

#### B. VS Code Deploy Tasks
Add to `.vscode/tasks.json`:
```json
{
  "label": "deploy",
  "type": "shell",
  "command": "npm",
  "args": ["run", "build"],
  "group": "build",
  "dependsOrder": "sequence",
  "dependsOn": ["type check"]
}
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **TypeScript Errors in Svelte Files**
   - Restart TypeScript service: Ctrl+Shift+P → "TypeScript: Restart TS Server"
   - Check `tsconfig.json` configuration

2. **Fabric.js Import Issues**
   - Use `// @ts-ignore` for fabric imports if needed
   - Ensure `@types/fabric` is installed

3. **Store Reactivity Issues**
   - Use `$` prefix for store subscriptions in Svelte
   - Avoid directly mutating store values

4. **CSS Not Loading**
   - Check import paths in `app.css`
   - Verify PostCSS configuration

5. **Build Errors**
   - Clear `.svelte-kit` directory
   - Reinstall node_modules

### Performance Optimization Tips
- Use Chrome DevTools for performance profiling
- Monitor bundle size with `npm run build`
- Use lazy loading for large components
- Optimize images and assets
- Enable gzip compression

## Conclusion

This workflow guide provides a comprehensive foundation for developing with the SvelteKit transform sync system in Visual Studio Code. The structured approach ensures efficient development, debugging, and deployment of the legal case management application.

Follow these practices to maintain code quality, performance, and team collaboration throughout the development lifecycle.
