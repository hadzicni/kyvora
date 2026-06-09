import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(
      request,
      new URL("/api/v1/settings", apiBaseUrl),
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the settings API." },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const response = await backendFetch(
      request,
      new URL("/api/v1/settings", apiBaseUrl),
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: await request.text(),
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the settings API." },
      { status: 502 }
    );
  }
}
