import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { ArtistTranslations } from "@/types/admin";
import {
  readUserArtistData,
  writeUserArtistData,
  readUserArtistTranslations,
  writeUserArtistTranslations,
  clearArtistDataCache,
} from "@/lib/artist-data-server";
import { getTenantIdFromRequest } from "@/lib/tenant";

export const runtime = "nodejs";

// Helper function to verify admin authentication
function getAdminSession(request: NextRequest) {
  // Try to get token from cookie first, then from Authorization header
  const cookieToken = request.cookies.get("admin-token")?.value;
  const authHeader = request.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken || headerToken;

  console.log("Auth debug:", {
    hasCookie: !!cookieToken,
    hasHeader: !!headerToken,
    hasToken: !!token,
    cookieValue: cookieToken ? "present" : "missing",
  });

  if (!token) {
    console.log("No token found");
    return null;
  }

  try {
    const result = verifyAdminToken(token);
    console.log("Token verification result:", result ? "valid" : "invalid");
    return result;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Resolve tenant
    const tenantId = await getTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: "Unknown tenant" },
        { status: 404 },
      );
    }

    // Read current artist data and translations
    const [artistData, artistTranslations] = await Promise.all([
      readUserArtistData(tenantId),
      readUserArtistTranslations(tenantId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        name: artistData.name,
        description: artistData.description,
        defaultLanguage: artistData.defaultLanguage,
        translations: artistTranslations,
      },
    });
  } catch (error) {
    console.error("Error reading artist data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to read artist data" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Resolve tenant
    const tenantId = await getTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: "Unknown tenant" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, description, translations } = body;

    // Validate primary data
    if (typeof name !== "string" || typeof description !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 },
      );
    }

    // Validate string lengths for primary data
    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Artist name too long (max 100 characters)",
        },
        { status: 400 },
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Artist description too long (max 1000 characters)",
        },
        { status: 400 },
      );
    }

    // Validate translations if provided
    if (translations && typeof translations === "object") {
      for (const [locale, translation] of Object.entries(translations)) {
        if (typeof translation !== "object" || !translation) continue;

        const { name: transName, description: transDesc } = translation as {
          name: string;
          description: string;
        };

        if (typeof transName !== "string" || typeof transDesc !== "string") {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid translation data for locale: ${locale}`,
            },
            { status: 400 },
          );
        }

        if (transName.length > 100) {
          return NextResponse.json(
            {
              success: false,
              message: `Translation name too long for ${locale} (max 100 characters)`,
            },
            { status: 400 },
          );
        }

        if (transDesc.length > 1000) {
          return NextResponse.json(
            {
              success: false,
              message: `Translation description too long for ${locale} (max 1000 characters)`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Create updated artist object
    const updatedArtist = {
      name: name.trim(),
      description: description.trim(),
    };

    // Write primary data to tenant-scoped artist.json
    await writeUserArtistData(tenantId, updatedArtist);

    // Write translations if provided
    if (translations && typeof translations === "object") {
      // Clean up translations (trim strings)
      const cleanTranslations: ArtistTranslations = {};
      for (const [locale, translation] of Object.entries(translations)) {
        if (typeof translation === "object" && translation) {
          const { name: transName, description: transDesc } = translation as {
            name: string;
            description: string;
          };
          if (typeof transName === "string" && typeof transDesc === "string") {
            cleanTranslations[locale] = {
              name: transName.trim(),
              description: transDesc.trim(),
            };
          }
        }
      }
      await writeUserArtistTranslations(tenantId, cleanTranslations);
    }

    // Clear cache to ensure fresh data on next request
    clearArtistDataCache(tenantId);

    return NextResponse.json({
      success: true,
      message: "Artist profile updated successfully",
      data: {
        ...updatedArtist,
        translations: translations || {},
      },
    });
  } catch (error) {
    console.error("Error updating artist data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update artist profile" },
      { status: 500 },
    );
  }
}
