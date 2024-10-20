import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="flex items-center justify-between border-b-2 p-5">
      <div className="flex items-center gap-x-5">
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/d/d7/North_Carolina_Tar_Heels_logo.svg"
          alt="UNC logo"
          width={50}
          height={50}
        />
        <span className="text-2xl">Swayambhu Internet Archive</span>
      </div>
      <div className="flex justify-center gap-x-5">
        <Link href={"/"} className="hover:text-blue-300">
          Home
        </Link>
        <Link href={"/dashboard"} className="hover:text-blue-300">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
