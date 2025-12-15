import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload/metadata
 * Uploads JSON metadata to Pinata IPFS
 * Expects JSON body with metadata object
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

    // Get metadata from request body
    const metadata = await request.json();

    console.log("Uploading metadata to Pinata:", metadata);

    // Upload JSON to Pinata
    const upload = await pinata.upload.public.json(metadata);

    console.log("Metadata upload successful:", upload);

    return NextResponse.json(
      {
        cid: upload.cid,
        uri: `ipfs://${upload.cid}`,
        name: upload.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Metadata upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
