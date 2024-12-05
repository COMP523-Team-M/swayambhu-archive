import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";
import Link from "next/link";
import ThemeButton from "./ThemeButton";

export default async function Header() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <nav className="flex items-center justify-between border-b-2 p-5">
      <div className="flex items-center gap-x-5">
        <Link href={"/"} className="flex items-center">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/d/d7/North_Carolina_Tar_Heels_logo.svg"
            alt="UNC logo"
            width={50}
            height={50}
          />
          <span className="ml-2 text-2xl font-semibold">Swayambhu Archive</span>
        </Link>
      </div>
      <div className="flex justify-center gap-x-5 font-semibold text-slate-700">
        {isLoggedIn && (
          <Link href={"/dashboard"} className="hover:text-sky-500">
            Dashboard
          </Link>
        )}
        {isLoggedIn ? (
          <LogoutLink className="font-semibold hover:text-sky-500">
            Log out
          </LogoutLink>
        ) : (
          <LoginLink className="font-semibold hover:text-sky-500">
            Sign in
          </LoginLink>
        )}
        <ThemeButton />
      </div>
    </nav>
  );
}
