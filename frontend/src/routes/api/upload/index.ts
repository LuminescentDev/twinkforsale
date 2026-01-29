import type { RequestHandler } from "@builder.io/qwik-city";
import { monitorFailedUpload } from "~/lib/system-monitoring";

export const onPost: RequestHandler = async ({ request, json }) => {
  const apiUrl = process.env.API_URL || "http://localhost:5000";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw json(400, { error: "No file provided" });
    }

    const authHeader = request.headers.get("Authorization") || "";

    const response = await fetch(`${apiUrl}/upload`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      await monitorFailedUpload(null, errorText || "Upload failed", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      throw json(response.status, { error: errorText || response.statusText });
    }

    const data = await response.json();
    throw json(201, data);
  } catch (error: any) {
    if (error?.status) throw error;
    throw json(500, { error: "Upload failed" });
  }
};
