import EditVideo from "@/components/EditVideo";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function page() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    redirect("/api/auth/login");
  }

  return (
    <div className="my-10 flex flex-col items-center">
      <EditVideo></EditVideo>
    </div>
  );
}
