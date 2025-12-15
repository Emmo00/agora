import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload/image
 * Uploads an image file to Pinata IPFS
 * Expects FormData with a "file" field containing the image
 */
export async function POST(request: NextRequest) {
  try {
    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
    });

    // Get the file from request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("Uploading file to Pinata:", file.name, file.type, file.size);

    // Upload to Pinata
    const upload = await pinata.upload.public.file(file);

    console.log("Upload successful:", upload);

    return NextResponse.json(
      {
        cid: upload.cid,
        uri: `ipfs://${upload.cid}`,
        name: upload.name,
        size: upload.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
