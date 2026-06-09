import { NextResponse } from "next/server";

import { apiBaseUrl } from "@/auth";

type ActuatorHealth = {
  status?: string;
};

const unavailableBody = {
  ok: false,
  status: "down",
  message: "Backend unavailable",
} as const;

function getSafeApiBaseUrl() {
  try {
    const url = new URL(apiBaseUrl);
    url.username = "";
    url.password = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return "configured backend";
  }
}

function unavailableResponse() {
  return NextResponse.json(
    {
      ...unavailableBody,
      expectedApi: getSafeApiBaseUrl(),
    },
    { status: 503 }
  );
}

export async function GET() {
  try {
    const response = await fetch(new URL("/actuator/health", apiBaseUrl), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      return unavailableResponse();
    }

    const body = (await response.json().catch(() => null)) as
      | ActuatorHealth
      | null;
    const actuatorStatus = body?.status?.toLowerCase();

    if (actuatorStatus && actuatorStatus !== "up") {
      return unavailableResponse();
    }

    return NextResponse.json(
      {
        ok: true,
        status: "up",
        expectedApi: getSafeApiBaseUrl(),
      },
      { status: 200 }
    );
  } catch {
    return unavailableResponse();
  }
}
