import { MenuDock } from "@/components/ui/shadcn-io/menu-dock";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      {children}
      <div className="fixed left-1/2 bottom-6 -translate-x-1/2 transform px-4 py-2 z-50">
        <MenuDock variant="compact" />
      </div>
    </div>
  );
}
