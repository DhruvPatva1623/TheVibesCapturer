/**
 * Cloudflare Worker — Backblaze B2 Proxy
 * ==========================================
 * Deploy this to Cloudflare Workers to handle B2 authentication
 * and avoid CORS issues when uploading from the browser.
 *
 * HOW TO DEPLOY:
 * 1. Go to https://workers.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this entire file into the editor
 * 4. Click "Save and Deploy"
 * 5. Copy the Worker URL into config.js > b2.workerUrl
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  // ── GET Upload URL ──────────────────────────────────────────────────────────
  if (url.pathname === "/get-upload-url" && request.method === "POST") {
    try {
      const { keyId, appKey, bucketName } = await request.json();

      // Step 1: Authorize account
      const authStr = btoa(`${keyId}:${appKey}`);
      const authRes = await fetch(
        "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
        {
          headers: { Authorization: `Basic ${authStr}` },
        }
      );
      const authData = await authRes.json();

      if (!authRes.ok) {
        return new Response(JSON.stringify({ error: authData }), {
          status: 401,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      // Step 2: Get bucket ID
      const listBucketsRes = await fetch(
        `${authData.apiUrl}/b2api/v2/b2_list_buckets`,
        {
          method: "POST",
          headers: {
            Authorization: authData.authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId: authData.accountId, bucketName }),
        }
      );
      const { buckets } = await listBucketsRes.json();
      const bucket = buckets[0];

      // Step 3: Get upload URL
      const uploadUrlRes = await fetch(
        `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
        {
          method: "POST",
          headers: {
            Authorization: authData.authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bucketId: bucket.bucketId }),
        }
      );
      const uploadUrlData = await uploadUrlRes.json();

      return new Response(JSON.stringify(uploadUrlData), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  // ── Delete File ─────────────────────────────────────────────────────────────
  if (url.pathname === "/delete-file" && request.method === "POST") {
    try {
      const { keyId, appKey, fileId, fileName } = await request.json();

      const authStr = btoa(`${keyId}:${appKey}`);
      const authRes = await fetch(
        "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
        {
          headers: { Authorization: `Basic ${authStr}` },
        }
      );
      const authData = await authRes.json();

      const deleteRes = await fetch(
        `${authData.apiUrl}/b2api/v2/b2_delete_file_version`,
        {
          method: "POST",
          headers: {
            Authorization: authData.authorizationToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileId, fileName }),
        }
      );
      const deleteData = await deleteRes.json();

      return new Response(JSON.stringify(deleteData), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("TvC Clicks B2 Worker is running!", {
    headers: CORS_HEADERS,
  });
}
