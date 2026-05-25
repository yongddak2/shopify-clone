import InfoSidebar from "./InfoSidebar";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-64px)] px-6 md:px-10 lg:px-14 py-16">
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10 lg:gap-16">
        <aside>
          <InfoSidebar />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
