import { ReduxProvider } from "@/components/redux-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/index.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={` min-h-screen bg-background text-foreground text-sm antialiased selection:bg-primary selection:text-primary-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReduxProvider>{children}</ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
