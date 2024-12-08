import UploadList from "@/components/upload-list/UploadList";
import VideoGallery from "@/components/video-gallery/VideoGallery";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    redirect("/api/auth/login");
  }

  return (
    <div className="my-10 flex justify-center">
      <UploadList />
      <VideoGallery></VideoGallery>
    </div>
  );
}
