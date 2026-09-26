import { http, HttpResponse, type JsonBodyType } from "msw";
import { setupServer } from "msw/node";

export const API = "http://api.test";

export function ok<T extends JsonBodyType>(data: T, status = 200): HttpResponse<JsonBodyType> {
  return HttpResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

export function fail(
  status: number,
  code: string,
  message = code,
  extra: { fieldErrors?: Record<string, string>; headers?: Record<string, string> } = {},
): HttpResponse<JsonBodyType> {
  return HttpResponse.json(
    {
      success: false,
      error: { code, message, ...(extra.fieldErrors ? { fieldErrors: extra.fieldErrors } : {}) },
      timestamp: new Date().toISOString(),
    },
    { status, headers: extra.headers },
  );
}

const defaults = [http.post(`${API}/auth/logout`, () => ok(null))];

export const server = setupServer(...defaults);
