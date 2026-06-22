import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QuickAddPanel from "@/components/cart/QuickAddPanel";
import CartPanel from "@/components/cart/CartPanel";

export const metadata: Metadata = {
  title: "PanTrKa | 의류 쇼핑몰",
  description: "미니멀 의류 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <QuickAddPanel />
          <CartPanel />
        </Providers>
      </body>
    </html>
  );
}
