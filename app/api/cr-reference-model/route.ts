// CC0 reference assembly: Innerscene original inline-six diesel engine.
// Source and license: https://www.innerscene.com/tools/library/3d-parts/inline-6-truck-diesel-engine-with-turbocharger-b5416332
// This is a visual reference mesh, NOT a rigged engine or measurement source for CR.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSET =
  "https://files.innerscene.com/library/inline-6-truck-diesel-engine-with-turbocharger-b5416332/25318cd87aacb751b1d8/inline-6-truck-diesel-engine-with-turbocharger.glb";

export async function GET() {
  try {
    const res = await fetch(ASSET, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "model/gltf-binary,application/octet-stream" },
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json({ error: "Reference mesh temporarily unavailable", status: res.status }, { status: 502 });
    }

    const data = await res.arrayBuffer();
    const header = new Uint8Array(data, 0, Math.min(data.byteLength, 4));
    const isGLB = header.length === 4 && header[0] === 0x67 && header[1] === 0x6c && header[2] === 0x54 && header[3] === 0x46;
    if (!isGLB || data.byteLength < 40 || data.byteLength > 8_000_000) {
      return Response.json({ error: "Unexpected model payload" }, { status: 502 });
    }
    return new Response(data, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Reference model could not be downloaded" }, { status: 502 });
  }
}
