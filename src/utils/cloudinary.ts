/**
 * Signed upload to Cloudinary using Cloud Name + API Key + API Secret.
 * Signature generated in-browser with Web Crypto (SHA-1) — no backend needed.
 */

async function sha1hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  folder = 'gastos-ocr',
): Promise<string> {
  const timestamp = String(Math.round(Date.now() / 1000));

  // Signature string: sorted params (excluding api_key, file, resource_type) + api_secret
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1hex(toSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Cloudinary error ${res.status}`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}
