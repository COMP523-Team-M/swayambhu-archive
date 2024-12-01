import UploadList from "@/components/upload-list/UploadList";
import VideoGallery from "@/components/VideoGallery";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default function Page() {
  // const { isAuthenticated } = getKindeServerSession();
  // const isLoggedIn = await isAuthenticated();
  // if (!isLoggedIn) {
  //   redirect("/api/auth/login");
  // }

  return (
    <div className="my-10 flex justify-center">
      <UploadList uploadList={["help", "me", "oh", "my", "god"]} />
      <VideoGallery></VideoGallery>

      {/* <button onClick={() => router.push("/dashboard/upload")}>
        Upload Video
      </button> */}
    </div>
  );
}
