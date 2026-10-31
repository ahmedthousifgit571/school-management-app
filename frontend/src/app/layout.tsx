import type { Metadata } from "next";
import { Caveat, Outfit, Pacifico, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Handwritten accents: margin notes, card scribbles.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

// The "MGM school management" wordmark only.
const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "MGM school management", template: "%s · MGM school management" },
  description: "School management dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${outfit.variable} ${caveat.variable} ${pacifico.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) inject attributes on <body> */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
