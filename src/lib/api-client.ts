export class ApiError extends Error {
  status: number;
  /** The raw `error` value from the response body — a string for simple
   * errors, or a structured object (e.g. Zod's flatten(), or per-field
   * custom-field validation errors) for anything a caller might want to
   * inspect field-by-field. */
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function summarize(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "fieldErrors" in error) {
    return "Validation failed.";
  }
  return "Something went wrong.";
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = body?.error;
    throw new ApiError(
      summarize(error) ?? response.statusText,
      response.status,
      error,
    );
  }

  return response.json();
}
