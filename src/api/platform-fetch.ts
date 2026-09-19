const STANDARD_NETWORK_FAILURE = "Network request failed";

function signalOf(input: RequestInfo | URL, init?: RequestInit): AbortSignal | null | undefined {
  return init?.signal ?? (input instanceof Request ? input.signal : undefined);
}

export async function platformFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (signalOf(input, init)?.aborted) throw error;
    throw new TypeError(STANDARD_NETWORK_FAILURE, { cause: error });
  }
}
