import { learnerMessage } from "./learner-messages";
export interface User {
  authenticated: boolean;
  id?: number;
  email?: string;
  displayName?: string;
}
export async function api<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  try {
    if (method !== "GET") {
      const response = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
      });
      if (!response.ok) throw Error("Sign-in is unavailable right now");
      const csrf = await response.json();
      headers[csrf.headerName] = csrf.token;
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => ({
      message:
        "Account features are unavailable right now. Guest exploration remains available.",
    }));
    if (!response.ok)
      throw Error(
        payload.message ??
          "This action could not be completed. Check the input and try again.",
      );
    return payload as T;
  } catch (error) {
    if (error instanceof TypeError)
      throw Error(
        "Could not connect right now. Your local work remains on this device.",
      );
    throw Error(
      learnerMessage(
        error,
        "This saved input could not be used. Check the values and try again.",
      ),
    );
  }
}
