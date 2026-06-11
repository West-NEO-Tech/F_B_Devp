import { toast } from "@/hooks/use-toast";

/**
 * Core fetch wrapper.
 * - GET: called by React Query defaultQueryFn via queryClient.ts
 * - POST/PATCH/DELETE: called directly by useMutation handlers
 *
 * Error contract:
 *   5xx / network error → toast.error + throw (React Query marks query as error)
 *   4xx → throw Error with server message (caller handles display)
 *   2xx → return parsed JSON
 */
export interface ApiRequestOptions {
  /** Suppress the global 5xx toast (caller handles the error). */
  silentServerError?: boolean;
}

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch (_networkErr) {
    toast({
      title: "网络错误",
      description: "无法连接到服务器，请检查网络或后端服务",
      variant: "destructive",
    });
    throw new Error("Network error");
  }

  if (response.status >= 500) {
    if (!options?.silentServerError) {
      toast({
        title: "服务器异常",
        description: `${response.status} ${response.statusText}`,
        variant: "destructive",
      });
    }
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    // 4xx: parse body for message, let caller display
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
      }
    } catch {
      // body not JSON, keep default message
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
