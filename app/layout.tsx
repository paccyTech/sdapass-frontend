import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SDA PASS MANAGEMENT",
  description: "Streamlined Umuganda attendance management for SDA leadership, admins, and members.",
  icons: {
    icon: [
      { url: '/sda-logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/sda-logo.png', type: 'image/png' },
    ],
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="main-shell">
        <ThemeProvider>
          <main className="content">{children}</main>
          <footer className="site-footer">
            © {new Date().getFullYear()} SDA PASS MANAGEMENT
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
