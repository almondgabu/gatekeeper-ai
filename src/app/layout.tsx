import "./globals.css";
import MobileShell from "../components/MobileShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <MobileShell>
          {children}
        </MobileShell>
      </body>
    </html>
  );
}