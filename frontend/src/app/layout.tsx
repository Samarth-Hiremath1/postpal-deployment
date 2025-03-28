import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout"; // Import the new client component

export const metadata: Metadata = {
  title: "PostPal",
  description: "Your personal Social Media Caption Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}