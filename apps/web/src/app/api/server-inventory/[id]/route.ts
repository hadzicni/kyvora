import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../_lib/backend";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function createBackendUrl(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const backendUrl = new URL(
    `/api/v1/servers/${encodeURIComponent(id)}`,
    apiBaseUrl
  );
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(
      request,
      await createBackendUrl(request, context),
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
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(
      request,
      await createBackendUrl(request, context),
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
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(
      request,
      await createBackendUrl(request, context),
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}
