import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The picture shown with a shared link to any page (Open Graph, and X, which
// falls back to it): the logo and what MANDE is, on the brand's dark green.

export const alt = "MANDE: grow your furniture business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
    const logo = await readFile(join(process.cwd(), "public/MANDE-logo-white.png"));
    const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 80,
                    background: "#042b16",
                    color: "#ffffff",
                }}
            >
                <img src={logoSrc} alt="" width={236} height={56} />
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>Grow your furniture business.</div>
                    <div style={{ fontSize: 34, color: "#aae7c2", lineHeight: 1.3 }}>
                        Real furniture jobs, paid as each stage is approved, and the country&apos;s top machines at our Lagos factory.
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
