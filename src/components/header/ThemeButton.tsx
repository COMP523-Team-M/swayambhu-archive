"use client";

import React, { useEffect, useState } from "react";
import { IoSunnyOutline } from "react-icons/io5";
import { BsMoonStars } from "react-icons/bs";
import { RiComputerLine } from "react-icons/ri";
import { useTheme } from "@/context/ThemeProvider";

export default function ThemeButton() {
  const [showThemes, setShowThemes] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (!e.target.closest(".theme-button")) setShowThemes(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <div className="theme-button relative self-center border-l-2 pl-5 text-xl text-slate-500 dark:text-sky-400">
        <IoSunnyOutline
          onClick={() => setShowThemes((prev) => !prev)}
          className="cursor-pointer"
        />
        {showThemes && (
          <div className="absolute right-0.5 top-full mt-5 rounded-lg border-2 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div
              className={`${theme === "light" && "text-sky-500"} flex cursor-pointer items-center rounded-lg px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700`}
              onClick={() => setTheme("light")}
            >
              <IoSunnyOutline className="mr-2" />
              <p
                className={`${theme === "light" ? "text-sky-500" : "text-slate-700"} text-sm font-semibold dark:text-slate-200`}
              >
                Light
              </p>
            </div>

            <div
              className={`${theme === "dark" && "text-sky-400"} flex cursor-pointer items-center px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700`}
              onClick={() => setTheme("dark")}
            >
              <BsMoonStars className="mr-2" />
              <p
                className={`${theme === "dark" && "text-sky-400"} text-sm font-semibold text-slate-700`}
              >
                Dark
              </p>
            </div>

            <div
              className={`${theme === "system" && "text-sky-500"} flex cursor-pointer items-center rounded-lg px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700`}
              onClick={() => setTheme("system")}
            >
              <RiComputerLine className="mr-2" />
              <p
                className={`${theme === "system" && "text-sky-500"} ${theme === "light" && "text-slate-700"} ${theme === "dark" && "text-slate-200"} text-sm font-semibold`}
              >
                System
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
