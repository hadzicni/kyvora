import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

function createBackendUrl(request: NextRequest) {
  const backendUrl = new URL("/api/v1/servers", apiBaseUrl);
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
}

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(createBackendUrl(request), {
      headers: {
        Accept: "application/json",
      },
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await backendFetch(createBackendUrl(request), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: await request.text(),
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}
