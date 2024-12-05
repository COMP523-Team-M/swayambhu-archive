import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UploadForm from "@/components/UploadForm";

export default async function page() {
  // const { isAuthenticated } = getKindeServerSession();
  // const isLoggedIn = await isAuthenticated();
  // if (!isLoggedIn) {
  //   redirect("/api/auth/login");
  // }

  return (
    <div className="my-10 flex flex-col items-center">
      <UploadForm></UploadForm>
    </div>
  );
}
