/**
 * IPFS utility functions for fetching and uploading data
 * Uses backend API routes to keep Pinata JWT secrets secure
 */

export async function fetchFromIPFS(uri: string): Promise<any> {
  if (!uri) return null;

  // Handle different URI formats
  let url = uri;
  if (uri.startsWith("ipfs://")) {
    // Use Pinata gateway from environment or fallback to public gateway
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "ipfs.io";
    url = `https://${gateway}/ipfs/${uri.slice(7)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch from IPFS: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch from IPFS:", error);
    return null;
  }
}

export function convertIPFSUrl(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "ipfs.io";
    return `https://${gateway}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

/**
 * Upload metadata to IPFS via backend API
 * The backend securely handles the Pinata JWT
 */
export async function uploadToIPFS(data: object): Promise<string> {
  try {
    console.log("Uploading metadata to backend...");
    
    const response = await fetch("/api/upload/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload metadata");
    }

    const result = await response.json();
    console.log("Metadata uploaded successfully:", result.uri);
    return result.uri; // Returns ipfs://CID format
  } catch (error) {
    console.error("Failed to upload to IPFS:", error);
    throw error;
  }
}

/**
 * Upload image file to IPFS via backend API
 * The backend securely handles the Pinata JWT using the Pinata SDK
 */
export async function uploadImageToIPFS(file: File): Promise<string> {
  try {
    console.log("Uploading image file:", file.name);
    
    // Create FormData with the file
    const formData = new FormData();
    formData.append("file", file);

    // Send to backend API which handles Pinata SDK upload
    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }

    const result = await response.json();
    console.log("Image uploaded successfully:", result.uri);
    
    // Return IPFS URI
    return result.uri; // Returns ipfs://CID format
  } catch (error) {
    console.error("Failed to upload image to IPFS:", error);
    throw error;
  }
}
