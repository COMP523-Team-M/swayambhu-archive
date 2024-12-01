import UploadList from "@/components/upload-list/UploadList";
import VideoGallery from "@/components/VideoGallery";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export interface Upload {
  upload: Promise<unknown>;
  name: string;
}

export default function Page() {
  // const { isAuthenticated } = getKindeServerSession();
  // const isLoggedIn = await isAuthenticated();
  // if (!isLoggedIn) {
  //   redirect("/api/auth/login");
  // }

  const help = {
    upload: new Promise((resolve) => setTimeout(() => resolve("help"), 3000)),
    name: "help",
  };

  const me = {
    upload: new Promise((resolve) => setTimeout(() => resolve("me"), 5000)),
    name: "me",
  };

  const oh = {
    upload: new Promise((resolve) => setTimeout(() => resolve("oh"), 7000)),
    name: "oh",
  };

  const my = {
    upload: new Promise((resolve) => setTimeout(() => resolve("my"), 5000)),
    name: "my",
  };

  const god = {
    upload: new Promise((resolve) => setTimeout(() => resolve("god"), 10000)),
    name: "god",
  };

  return (
    <div className="my-10 flex justify-center">
      <UploadList uploadList={[help, me, oh, my, god]} />
      <VideoGallery></VideoGallery>
    </div>
  );
}
