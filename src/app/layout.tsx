import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ThemeRegistry from "@/components/ThemeRegistry";
import { CardFlipProvider } from "@/contexts/CardFlipContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whodunit Party",
  description: "Murder mystery party game",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ key: 'mui' }}>
          <NextIntlClientProvider messages={messages}>
            <ThemeRegistry>
              <CardFlipProvider>
                {children}
              </CardFlipProvider>
            </ThemeRegistry>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
