/**
 * Utility to test Pinata configuration
 * Run this to verify your PINATA_JWT is working properly
 */

export async function testPinataConfig() {
  try {
    console.log("Testing Pinata configuration...");

    // Test 1: Check if JWT is configured
    const response = await fetch("/api/upload/metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: true,
        message: "Pinata configuration test",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Pinata test failed:", error);
      return false;
    }

    const data = await response.json();
    console.log("✅ Pinata configuration is working!");
    console.log("Test CID:", data.cid);
    console.log("Test URI:", data.uri);
    return true;
  } catch (error) {
    console.error("❌ Pinata test error:", error);
    return false;
  }
}
