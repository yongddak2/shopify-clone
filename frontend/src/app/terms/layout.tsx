export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] px-6 md:px-10 lg:px-14 py-16">
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
}
