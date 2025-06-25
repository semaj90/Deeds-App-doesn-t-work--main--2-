// Copilot Instructions:
// Frontend API bindings for SSR + Tauri
// If running in web mode, use HTTP fetch
// If running in Tauri mode, use @tauri-apps/api.invoke()
// Wrap functions: saveCaseDraft(caseId, userId, evidence), summarizeCase(caseId, userId, evidence)

import { invoke } from '@tauri-apps/api/tauri';

async function isTauri(): Promise<boolean> {
  return window.__TAURI__ !== undefined;
}

export async function saveCaseDraft(caseId: string, userId: string, evidence: any): Promise<any> {
  if (await isTauri()) {
    return await invoke('save_case', { caseId, userId, evidence });
  } else {
    return await fetch(`/api/case/${caseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, evidence })
    });
  }
}

export async function summarizeCase(caseId: string, userId: string, evidence: any): Promise<string> {
  if (await isTauri()) {
    return await invoke('summarize_case', { caseId, userId, evidence });
  } else {
    const response = await fetch(`/api/summarize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ caseId, userId, evidence })
    });
    const result = await response.json();
    return result.summary;
  }
}
