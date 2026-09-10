/* ---------------------------------------------------------------------------
 * The token that lets a browser upload straight to object storage.
 *
 * A serverless request body is capped far below the size of a film, so the
 * bytes must not come through this app at all. Instead the browser asks here
 * for a short-lived token and sends the file directly to the blob store; the
 * only thing that reaches us is this small JSON exchange.
 *
 * The rules still live on this side — which content types are allowed and how
 * large a file may be are decided here, not by the caller.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { uploadConfig } from "@/server/uploads/store";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

async function postHandler(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) {
    return NextResponse.json({ message: "Malformed upload request" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        message:
          "No blob store is connected, so large uploads cannot be accepted. " +
          "Create one in the project's Storage tab.",
      },
      { status: 501 },
    );
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const config = uploadConfig();
        return {
          allowedContentTypes: config.allowedMimeTypes,
          maximumSizeInBytes: config.maxSizeBytes,
          // two people uploading the same filename must not overwrite each other
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the upload";
    return NextResponse.json({ message }, { status: 400 });
  }
}

/* The public site asks for this token from another origin. */
export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
