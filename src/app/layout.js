import './globals.css';

export const metadata = {
  title: 'Dj Haunter | Premium Sound & Setup Discovery',
  description: 'Discover high-bass heavy sound systems & professional DJs for Visarjan, Weddings & Festivals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Added suppressHydrationWarning to block browser extension errors */}
      <body suppressHydrationWarning className="bg-slate-950 text-slate-50 antialiased min-h-screen flex flex-col">
        
        {/* Main Content Area - Removed pt-24 because custom page navbars handle their own spacing now */}
        <main className="flex-grow pb-12">
          {children}
        </main>
        
      </body>
    </html>
  );
}