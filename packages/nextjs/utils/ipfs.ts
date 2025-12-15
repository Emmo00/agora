/**
 * IPFS utilities for uploading and fetching data
 */

export const uploadImageToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ipfsHash;
  } catch (error) {
    console.error("Error uploading image to IPFS:", error);
    throw error;
  }
};

export const uploadToIPFS = async (data: unknown): Promise<string> => {
  try {
    const response = await fetch("/api/upload/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.ipfsHash;
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw error;
  }
};

export const fetchFromIPFS = async (ipfsHash: string): Promise<unknown> => {
  try {
    const url = convertIPFSUrl(ipfsHash);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    throw error;
  }
};

export const convertIPFSUrl = (ipfsHash: string): string => {
  if (ipfsHash.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash.replace("ipfs://", "")}`;
  }

  if (ipfsHash.startsWith("Qm")) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  return ipfsHash;
};
