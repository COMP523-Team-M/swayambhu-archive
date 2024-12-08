import type { Metadata } from "next";
import Header from "@/components/header/Header";
import "./globals.css";
import { UploadProvider } from "@/context/Uploads";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swayambhu Archive",
  description: "An internet archive for interviews in Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body
        className={`bg-slate-50 font-sans antialiased selection:bg-blue-200 selection:text-blue-900 dark:bg-slate-900 dark:text-white dark:selection:bg-blue-800 dark:selection:text-white`}
      >
        <ThemeProvider>
          <Header />
          <div className="container mx-auto min-h-fit">
            <UploadProvider>{children}</UploadProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
