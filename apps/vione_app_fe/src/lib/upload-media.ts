import { getNestApiUrl } from "@/lib/api-client";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("vibe_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("sb-access-token")
  );
}

export async function uploadProductMedia(file: File, sellerId?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (sellerId) {
    formData.append("sellerId", sellerId);
  }

  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getNestApiUrl("/upload/file"), {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errObj = await response.json();
      if (errObj?.message) {
        errMsg = Array.isArray(errObj.message) ? errObj.message.join(", ") : errObj.message;
      }
    } catch {
      // fallback
    }
    throw new Error(`Upload failed (${response.status}): ${errMsg}`);
  }
  const data = await response.json();
  return getNestApiUrl(data.url);
}

export async function signProductMediaPreview(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return getNestApiUrl(pathOrUrl);
}

export async function uploadAssociationLogo(file: File, associationId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (associationId) {
    formData.append("associationId", associationId);
  }

  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getNestApiUrl("/upload/file"), {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errObj = await response.json();
      if (errObj?.message) {
        errMsg = Array.isArray(errObj.message) ? errObj.message.join(", ") : errObj.message;
      }
    } catch {
      // fallback
    }
    throw new Error(`Upload failed (${response.status}): ${errMsg}`);
  }
  const data = await response.json();
  return getNestApiUrl(data.url);
}

export async function uploadChatAttachment(file: File): Promise<{
  url: string;
  name: string;
  size: number;
  isImage: boolean;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getNestApiUrl("/upload/file"), {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const errObj = await response.json();
      if (errObj?.message) {
        errMsg = Array.isArray(errObj.message) ? errObj.message.join(", ") : errObj.message;
      }
    } catch {
      // fallback
    }
    throw new Error(`Upload failed (${response.status}): ${errMsg}`);
  }
  const data = await response.json();
  const rawUrl: string = data.url || "";
  const fullUrl = rawUrl.startsWith("http") ? rawUrl : getNestApiUrl(rawUrl);
  const isImage = file.type.startsWith("image/");

  return {
    url: fullUrl,
    name: file.name,
    size: file.size,
    isImage,
  };
}

