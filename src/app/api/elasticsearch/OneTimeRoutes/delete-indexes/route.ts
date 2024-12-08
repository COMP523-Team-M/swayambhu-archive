import { NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export async function DELETE() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    redirect("/api/auth/login");
  }

  try {
    await client.indices.delete({ index: "videos" });
    await client.indices.delete({ index: "video_snippets" });

    return NextResponse.json(
      { message: "Indexes deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting indexes:", error);
    return NextResponse.json(
      { message: "Error deleting indexes" },
      { status: 500 },
    );
  }
}
