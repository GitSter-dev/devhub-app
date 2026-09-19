import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ApiError } from "@/api/api-error";
import type { ErrorCode } from "@/api/envelope";

export function applyServerFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  fieldForCode: Partial<Record<ErrorCode, Path<T>>> = {},
): boolean {
  let applied = false;

  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const match = fields.find((candidate) => candidate === field);
    if (match) {
      setError(match, { type: "server", message }, { shouldFocus: !applied });
      applied = true;
    }
  }

  const mapped = fieldForCode[error.code];
  if (mapped) {
    setError(mapped, { type: "server", message: error.message }, { shouldFocus: !applied });
    applied = true;
  }

  return applied;
}
