import "./globals.css";
import MobileShell from "../components/MobileShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <MobileShell>
          {children}
        </MobileShell>
      </body>
    </html>
  );
}