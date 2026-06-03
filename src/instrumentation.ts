/**
 * Runs once when the Next.js server process boots. We open the MongoDB
 * connection here so the database is connected at startup rather than on the
 * first request that needs it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { connectToDatabase } = await import("@/lib/db/connect");
  try {
    await connectToDatabase();
  } catch (err) {
    console.error("❌ Startup MongoDB connection failed:", err);
  }
}
