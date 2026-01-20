import { NextResponse } from "next/server"

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  "http://localhost:8000"

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_API_URL}/ai/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return NextResponse.json(
        {
          online: false,
          status: "offline",
          error: errorText || `Backend responded with ${backendResponse.status}`,
        },
        { status: 200 },
      )
    }

    const data = await backendResponse.json()

    return NextResponse.json(
      {
        online: data?.online === true,
        status: data?.status ?? (data?.online ? "online" : "offline"),
      },
      { status: 200 },
    )
  } catch (error) {
    // Silently handle connection refused errors (backend not running)
    const isConnectionRefused = error instanceof Error &&
      (error.cause as Error | undefined)?.message?.includes('ECONNREFUSED')

    if (!isConnectionRefused) {
      console.error("AI health check failed:", error)
    }

    return NextResponse.json(
      {
        online: false,
        status: "offline",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during AI health check",
      },
      { status: 200 },
    )
  }
}
