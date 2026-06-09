import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../_lib/backend";

export async function POST(request: NextRequest) {
  try {
    const response = await backendFetch(
      request,
      new URL("/api/v1/me/change-password", apiBaseUrl),
      {
        method: "POST",
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
      { message: "Unable to connect to the profile API." },
      { status: 502 }
    );
  }
}
