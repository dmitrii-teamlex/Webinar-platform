import { Sidebar } from "@/components/features/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
