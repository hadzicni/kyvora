export type ApiErrorBody = {
  message?: string;
  details?: string[];
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiErrorFactory<TError extends Error> = (
  message: string,
  status: number,
  details: string[]
) => TError;

export function appendSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: unknown
) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendSearchParam(searchParams, key, entry));
    return;
  }

  searchParams.append(key, String(value));
}

export async function apiRequest<T, TError extends Error = ApiRequestError>(
  path: string,
  init?: RequestInit,
  createError?: ApiErrorFactory<TError>
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await parseApiError(
      response,
      createError ??
        ((message, status, details) =>
          new ApiRequestError(message, status, details) as unknown as TError)
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

async function parseApiError<TError extends Error>(
  response: Response,
  createError: ApiErrorFactory<TError>
) {
  let message = `Request failed with status ${response.status}`;
  let details: string[] = [];

  try {
    const body = (await response.json()) as ApiErrorBody;
    message = body.message ?? message;
    details = Array.isArray(body.details) ? body.details : [];
  } catch {
    // Keep the status-derived fallback if the response is not JSON.
  }

  return createError(message, response.status, details);
}

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiRequestError) {
    return error.details[0] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
