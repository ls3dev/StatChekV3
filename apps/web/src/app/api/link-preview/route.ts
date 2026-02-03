import { NextRequest, NextResponse } from "next/server";

interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  url: string;
}

// Parse OG meta tags from HTML
function parseOGTags(html: string, baseUrl: string): LinkPreview {
  const getMetaContent = (property: string): string | null => {
    // Try og: prefix first
    const ogMatch = html.match(
      new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
    ) || html.match(
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i")
    );
    if (ogMatch) return ogMatch[1];

    // Try twitter: prefix
    const twitterMatch = html.match(
      new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`, "i")
    ) || html.match(
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${property}["']`, "i")
    );
    if (twitterMatch) return twitterMatch[1];

    // Try regular meta name
    const metaMatch = html.match(
      new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i")
    ) || html.match(
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i")
    );
    if (metaMatch) return metaMatch[1];

    return null;
  };

  // Get title from OG or fallback to <title> tag
  let title = getMetaContent("title");
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }

  // Get description
  const description = getMetaContent("description");

  // Get image
  let image = getMetaContent("image");
  if (image && !image.startsWith("http")) {
    // Make relative URLs absolute
    try {
      image = new URL(image, baseUrl).href;
    } catch {
      image = null;
    }
  }

  // Get favicon
  let favicon: string | null = null;
  const faviconMatch = html.match(
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i
  ) || html.match(
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i
  );
  if (faviconMatch) {
    favicon = faviconMatch[1];
    if (!favicon.startsWith("http")) {
      try {
        favicon = new URL(favicon, baseUrl).href;
      } catch {
        favicon = null;
      }
    }
  }
  // Default favicon fallback
  if (!favicon) {
    try {
      favicon = new URL("/favicon.ico", baseUrl).href;
    } catch {
      favicon = null;
    }
  }

  // Decode HTML entities in title and description
  const decodeHtml = (text: string | null): string | null => {
    if (!text) return null;
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/");
  };

  return {
    title: decodeHtml(title),
    description: decodeHtml(description),
    image,
    favicon,
    url: baseUrl,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  try {
    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "StatCheck Link Preview Bot/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      // Not an HTML page, return basic info
      return NextResponse.json({
        title: parsedUrl.hostname,
        description: null,
        image: null,
        favicon: null,
        url,
      });
    }

    const html = await response.text();
    const preview = parseOGTags(html, url);

    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 }
      );
    }

    console.error("Link preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch link preview" },
      { status: 500 }
    );
  }
}
