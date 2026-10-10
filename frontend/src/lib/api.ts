import type { GenerateConfig, GenerateResponse } from "./types";

// In dev, Vite proxies /api and /health to the FastAPI backend (see vite.config.ts).
// In production you can set VITE_API_BASE to point at the deployed backend.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export interface AppConfig {
  provider: string;
  model: string;
  min_items: number;
  max_items: number;
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) throw new Error(`Config request failed (${res.status})`);
  return res.json();
}

export async function extractFile(
  file: File,
): Promise<{ filename: string; characters: number; content: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Extraction failed (${res.status})`);
  }
  return res.json();
}

export async function generateAsset(
  content: string,
  config: GenerateConfig,
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, ...config }),
  });
  if (!res.ok) {
    const detail = await safeDetail(res);
    throw new Error(detail || `Generation failed (${res.status})`);
  }
  return res.json();
}

async function safeDetail(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail))
      return data.detail.map((d: any) => d.msg).join("; ");
    return null;
  } catch {
    return null;
  }
}
