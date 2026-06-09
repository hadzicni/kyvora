export type BackendHealth = {
  ok: boolean;
  status: "up" | "down";
  message?: string;
  expectedApi?: string;
};

export async function getBackendHealth(): Promise<BackendHealth> {
  let response: Response;

  try {
    response = await fetch("/api/backend-health", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: "down",
      message: "Backend unavailable",
    };
  }

  const body = (await response.json().catch(() => null)) as
    | Partial<BackendHealth>
    | null;

  if (!response.ok || !body?.ok) {
    return {
      ok: false,
      status: "down",
      message: body?.message ?? "Backend unavailable",
      expectedApi: body?.expectedApi,
    };
  }

  return {
    ok: true,
    status: "up",
    expectedApi: body.expectedApi,
  };
}
