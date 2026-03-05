import connectToDatabase from "@/lib/mongodb";
import Event, { type IEvent } from "@/database/event.model";
import { NextRequest, NextResponse } from "next/server";

/** Slug validation: lowercase alphanumeric characters and hyphens only */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Route context containing the dynamic `slug` parameter */
interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** Validates the slug format and returns a normalised string or null */
function parseSlug(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  return SLUG_PATTERN.test(trimmed) ? trimmed : null; 
} 
                
/**
 * GET /api/events/[slug]
 * Returns a single event document matching the provided slug.
 */
export async function GET(
  _req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug: rawSlug } = await context.params;

    // --- Validate slug parameter ---
    if (!rawSlug) {
      return NextResponse.json(
        { message: "Slug parameter is required" },
        { status: 400 }
      );
    }

    const slug = parseSlug(rawSlug);
    if (!slug) {
      return NextResponse.json(
        { message: "Invalid slug format" },
        { status: 400 }
      );
    }

    // --- Fetch event from database ---
    await connectToDatabase();

    const event: IEvent | null = await Event.findOne({ slug }).lean();

    if (!event) {
      return NextResponse.json(
        { message: `Event not found for slug: ${slug}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Event fetched successfully", event },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/events/[slug] error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch event",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
