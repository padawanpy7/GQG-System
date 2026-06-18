import { redirect } from "next/navigation";
import { leerSesion } from "@/lib/auth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await leerSesion();
  if (!sesion) redirect("/login");
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header usuario={sesion.usuario} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-xl">{children}</main>
      </div>
    </div>
  );
}
