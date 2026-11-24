import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "aos/dist/aos.css";
import "./globals.css";
import Providers from "@/components/Providers";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "MCPIC | Mirpur Cantonment Public Information & Technology Club",
    template: "MCPIC | %s",
  },
  description:
    "Mirpur Cantonment Public Information and Technology Club — fostering innovative thinkers, tech enthusiasts, and future leaders since 2022.",
  icons: {
    icon: "/mcpic-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-[#080f0e] text-[#e8f5f3] font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
