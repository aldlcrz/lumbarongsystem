import { Inter, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Lumbarong - Wear the Spirit of the Philippines",
  description: "A comprehensive e-commerce platform for Philippine heritage barong crafts.",
};

import { SocketProvider } from "@/context/SocketContext";
import BroadcastNotification from "@/components/BroadcastNotification";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} ${playfair.variable} antialiased`}>
        <SocketProvider>
          <BroadcastNotification />
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
