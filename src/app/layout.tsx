import type { Metadata } from "next";
import { Kantumruy_Pro, Noto_Sans_Khmer } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const kantumruy = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-khmer",
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "សម្លេងខ្មែរ — ការបម្លែងសំឡេងទៅជាអក្សរ",
  description: "សម្លេងខ្មែរ — សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរយ៉ាងត្រឹមត្រូវ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${kantumruy.variable} ${notoKhmer.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
