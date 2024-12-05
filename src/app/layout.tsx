import type { Metadata } from "next";
import Header from "@/components/header/Header";
import "./globals.css";
import { UploadProvider } from "@/context/Uploads";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="container mx-auto min-h-screen">
          <ThemeProvider>
            <Header />
            <UploadProvider>{children}</UploadProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
