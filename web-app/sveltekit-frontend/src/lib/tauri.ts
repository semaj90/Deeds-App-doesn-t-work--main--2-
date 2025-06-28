// Tauri API integration for desktop app
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

// Environment detection
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Database operations via Tauri commands
export class TauriAPI {
  // Cases
  static async getCases() {
    if (!isTauri) {
      // Fallback to web API
      const response = await fetch('/api/cases');
      return response.json();
    }
    return invoke('get_cases');
  }

  static async createCase(caseData: any) {
    if (!isTauri) {
      // Fallback to web API
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      return response.json();
    }
    return invoke('create_case', {
      title: caseData.title,
      description: caseData.description
    });
  }

  // Reports
  static async getReports() {
    if (!isTauri) {
      // Fallback to web API
      const response = await fetch('/api/reports');
      return response.json();
    }
    return invoke('get_reports');
  }

  static async createReport(reportData: any) {
    if (!isTauri) {
      // Fallback to web API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      return response.json();
    }
    return invoke('create_report', {
      title: reportData.title,
      content: reportData.content,
      summary: reportData.summary
    });
  }

  // LLM operations
  static async listLLMModels() {
    if (!isTauri) {
      // Return empty array or call web API if available
      return [];
    }
    return invoke('list_llm_models');
  }

  static async runLLMInference(model: string, prompt: string) {
    if (!isTauri) {
      // Fallback to web API or return error
      throw new Error('LLM inference only available in desktop app');
    }
    return invoke('run_llm_inference', { model, prompt });
  }

  static async uploadLLMModel(filePath: string) {
    if (!isTauri) {
      throw new Error('LLM model upload only available in desktop app');
    }
    return invoke('upload_llm_model', { filePath });
  }

  // Authentication - always use web API since it handles sessions
  static async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  static async register(userData: any) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  static async logout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    return response.ok;
  }

  static async getUserProfile() {
    const response = await fetch('/api/user/profile');
    return response.json();
  }

  // File operations
  static async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('/api/user/avatar/upload', {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
}

// Event listeners for Tauri events
export function setupTauriEventListeners() {
  if (!isTauri) return;

  listen('tauri://close-requested', () => {
    console.log('App close requested');
  });

  listen('tauri://window-resized', (event) => {
    console.log('Window resized:', event.payload);
  });
}

// Initialize Tauri integration
export function initializeTauri() {
  if (isTauri) {
    console.log('Running in Tauri desktop app');
    setupTauriEventListeners();
  } else {
    console.log('Running in web browser');
  }
}

export default TauriAPI;
