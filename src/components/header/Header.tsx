import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Image from "next/image";
import Link from "next/link";
import ThemeButton from "./ThemeButton";
import { motion } from "framer-motion";
import { FiGrid } from "react-icons/fi";

export default async function Header() {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl">
      <div className="relative">
        {/* Gradient line at bottom */}
        <div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50 dark:via-slate-800" />
        
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-x-5">
            <Link href={"/"} className="group flex items-center">
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d7/North_Carolina_Tar_Heels_logo.svg"
                  alt="UNC logo"
                  width={50}
                  height={50}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <span className="ml-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-2xl font-bold text-transparent transition-colors duration-300 dark:from-slate-200 dark:to-slate-400">
                Swayambhu Archive
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-x-5">
            {isLoggedIn && (
              <div className="transition-transform duration-300 hover:scale-105">
                <Link
                  href={"/dashboard"}
                  className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:text-blue-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-blue-400"
                >
                  <FiGrid className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </div>
            )}
            
            <div className="transition-transform duration-300 hover:scale-105">
              {isLoggedIn ? (
                <LogoutLink className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:text-blue-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-blue-400">
                  Log out
                </LogoutLink>
              ) : (
                <LoginLink className="flex items-center gap-2 rounded-lg bg-white/50 px-4 py-2 font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:text-blue-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-blue-400">
                  Sign in
                </LoginLink>
              )}
            </div>
            
            <ThemeButton />
          </div>
        </div>
      </div>
    </div>
  );
}