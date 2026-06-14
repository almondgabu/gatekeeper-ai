import "./globals.css";
import Sidebar from "../components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-[#020617] text-white min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}