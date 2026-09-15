type ApiError = { error?: { code?: string; message?: string } };
export class ApiRequestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function mutate<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  const tokenResponse = await fetch("/api/csrf", { cache: "no-store" });
  if (!tokenResponse.ok)
    throw new ApiRequestError("FORM_START", "The form could not start. Please try again.");
  const { csrfToken } = (await tokenResponse.json()) as { csrfToken: string };
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const error = result as ApiError;
    throw new ApiRequestError(
      error.error?.code ?? "REQUEST_FAILED",
      error.error?.message ?? "The request failed. Please try again.",
    );
  }
  return result as T;
}
