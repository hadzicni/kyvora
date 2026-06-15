import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../../_lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const response = await backendFetch(
      request,
      new URL(`/api/v1/notifications/${encodeURIComponent(id)}/read`, apiBaseUrl),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );
    const body = await response.text();
    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the notifications API." },
      { status: 502 }
    );
  }
}
