export function getApiUrl(path: string) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
  return `${baseUrl}${path}`
}

export async function fetchApi<T = any>(path: string): Promise<T[]> {
  const url = getApiUrl(path)
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}
