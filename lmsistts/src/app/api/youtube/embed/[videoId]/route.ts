import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await context.params;
  const html = `
    <html>
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body style="margin:0;padding:0;overflow:hidden;">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
