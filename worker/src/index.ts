export interface Env {
  HAMDDU_IMAGES: R2Bucket;
  R2_PUBLIC_URL: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/upload") {
      return handleUpload(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid form data" }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ error: "file field is required" }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: "Only JPEG, PNG, GIF, WEBP images are allowed" }, 400);
  }

  if (file.size > MAX_SIZE) {
    return json({ error: "File too large (max 5MB)" }, 400);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `posts/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  await env.HAMDDU_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
  return json({ url: publicUrl }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
