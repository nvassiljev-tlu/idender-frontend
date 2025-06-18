import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Idender",
  description: "Tallinn French Lyceum's student internal website.",
};

 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
 }>) {
   return (
     <html lang="en" className="h-full">
       <body
         className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}
       >
         {children}
       </body>
     </html>
   );
 }

