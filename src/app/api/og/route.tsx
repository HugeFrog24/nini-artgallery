import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export async function GET(request: Request) {
  try {
    // Get parameters from query params
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";
    const artworkId = searchParams.get("artworkId");
    const artworkTitle = searchParams.get("artworkTitle");
    const artworkDescription = searchParams.get("artworkDescription");
    const artworkCategory = searchParams.get("artworkCategory");

    // Get translations for the specified locale
    const t = await getTranslations({ locale });

    const siteName = t("Site.name", { artistName: t("Artist.name") });
    const siteDescription = t("Site.description");

    // Determine if this is an artwork-specific OG image
    const isArtworkPage = artworkId && artworkTitle;

    // Load fonts for international character support (edge runtime compatible)
    // Fail hard if base URL or fonts are missing - force developers to fix configuration
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      throw new Error(
        "NEXT_PUBLIC_BASE_URL environment variable is required for OpenGraph image generation",
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const [
      regularResponse,
      boldResponse,
      georgianResponse,
      georgianBoldResponse,
    ] = await Promise.all([
      fetch(new URL("/fonts/Noto_Sans/static/NotoSans-Regular.ttf", baseUrl)),
      fetch(new URL("/fonts/Noto_Sans/static/NotoSans-Bold.ttf", baseUrl)),
      fetch(
        new URL(
          "/fonts/Noto_Sans_Georgian/static/NotoSansGeorgian-Regular.ttf",
          baseUrl,
        ),
      ),
      fetch(
        new URL(
          "/fonts/Noto_Sans_Georgian/static/NotoSansGeorgian-Bold.ttf",
          baseUrl,
        ),
      ),
    ]);

    // Fail hard if any font is missing
    if (!regularResponse.ok) {
      throw new Error(
        `Failed to load Noto Sans Regular font: ${regularResponse.status} ${regularResponse.statusText}`,
      );
    }
    if (!boldResponse.ok) {
      throw new Error(
        `Failed to load Noto Sans Bold font: ${boldResponse.status} ${boldResponse.statusText}`,
      );
    }
    if (!georgianResponse.ok) {
      throw new Error(
        `Failed to load Noto Sans Georgian Regular font: ${georgianResponse.status} ${georgianResponse.statusText}`,
      );
    }
    if (!georgianBoldResponse.ok) {
      throw new Error(
        `Failed to load Noto Sans Georgian Bold font: ${georgianBoldResponse.status} ${georgianBoldResponse.statusText}`,
      );
    }

    const [regularFont, boldFont, georgianFont, georgianBoldFont] =
      await Promise.all([
        regularResponse.arrayBuffer(),
        boldResponse.arrayBuffer(),
        georgianResponse.arrayBuffer(),
        georgianBoldResponse.arrayBuffer(),
      ]);

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF69B4, #FFB6C1)",
          padding: "40px",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.95)",
            padding: isArtworkPage ? "25px 40px" : "40px 60px",
            borderRadius: "20px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(10px)",
            maxWidth: isArtworkPage ? "1000px" : "900px",
            width: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isArtworkPage ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                textAlign: "center",
              }}
            >
              {/* Artwork-specific content */}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 6px 0",
                  color: "#FF1493",
                  fontFamily: "Noto Sans Georgian, Noto Sans",
                }}
              >
                {siteName}
              </div>
              <h1
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  margin: "0 0 10px 0",
                  background: "linear-gradient(135deg, #FF1493, #FF69B4)",
                  backgroundClip: "text",
                  color: "transparent",
                  lineHeight: 1.1,
                  fontFamily: "Noto Sans Georgian, Noto Sans",
                }}
              >
                {artworkTitle}
              </h1>
              {artworkDescription && (
                <p
                  style={{
                    fontSize: 20,
                    margin: "0 0 10px 0",
                    color: "#4A4A4A",
                    lineHeight: 1.3,
                    maxWidth: "800px",
                    fontFamily: "Noto Sans Georgian, Noto Sans",
                  }}
                >
                  {artworkDescription.length > 80
                    ? artworkDescription.substring(0, 80) + "..."
                    : artworkDescription}
                </p>
              )}
              {artworkCategory && (
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    margin: "0",
                    color: "#666",
                    background: "rgba(255, 105, 180, 0.15)",
                    padding: "5px 12px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 105, 180, 0.4)",
                    fontFamily: "Noto Sans Georgian, Noto Sans",
                  }}
                >
                  {artworkCategory}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* General site content */}
              <h1
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  margin: "0 0 20px 0",
                  background: "linear-gradient(135deg, #FF1493, #FF69B4)",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
                  fontFamily: "Noto Sans Georgian, Noto Sans",
                }}
              >
                {siteName}
              </h1>
              <p
                style={{
                  fontSize: 36,
                  margin: "0",
                  color: "#4A4A4A",
                  textAlign: "center",
                  maxWidth: "600px",
                  lineHeight: 1.4,
                  letterSpacing: "-0.02em",
                  fontFamily: "Noto Sans Georgian, Noto Sans",
                }}
              >
                {siteDescription}
              </p>
            </>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans",
            data: regularFont,
            weight: 400,
            style: "normal",
          },
          {
            name: "Noto Sans",
            data: boldFont,
            weight: 700,
            style: "normal",
          },
          {
            name: "Noto Sans Georgian",
            data: georgianFont,
            weight: 400,
            style: "normal",
          },
          {
            name: "Noto Sans Georgian",
            data: georgianBoldFont,
            weight: 700,
            style: "normal",
          },
        ],
      },
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`${error.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
