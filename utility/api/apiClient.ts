export const apiClient = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Try parsing JSON carefully (in case response is not JSON)
  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "An error occurred during the request");
  }

  return data;
};

