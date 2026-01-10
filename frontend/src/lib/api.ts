import type { DatasetIndex, PreviewResponse, ProfileResponse, DashboardResponse } from "./types"

const API_BASE = "http://localhost:8000"

async function jsonOrThrow(res: Response) {
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = data?.detail || "Request failed"
    throw new Error(msg)
  }
  return data
}

export async function listDatasets(): Promise<DatasetIndex> {
  const res = await fetch(`${API_BASE}/api/datasets`)
  return jsonOrThrow(res)
}

export async function uploadDataset(file: File): Promise<{ id: string; meta: any }> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`${API_BASE}/api/datasets/upload`, {
    method: "POST",
    body: fd
  })
  return jsonOrThrow(res)
}

export async function getPreview(id: string): Promise<PreviewResponse> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}/preview`)
  return jsonOrThrow(res)
}

export async function getProfile(id: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}/profile`)
  return jsonOrThrow(res)
}

export async function getDashboard(id: string): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}/dashboard`)
  return jsonOrThrow(res)
}
