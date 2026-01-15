
import type { ReactNode } from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Home, Wrench, ShoppingCart, ListChecks } from "lucide-react";
import Logo from "@/components/logo";
import DashboardHeader from "@/components/dashboard-header";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const user = { name: "Admin User", role: "Administrator", avatarUrl: "https://picsum.photos/seed/1/100/100" };
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/tools/dashboard">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Procurement Sessions">
                <Link href="/tools/procurement-sessions">
                  <ListChecks />
                  <span>Procurement Sessions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Procurement Assistant">
                <Link href="/tools/procurement-assistant">
                  <ShoppingCart />
                  <span>Procurement Assistant</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
         {/* Footer items can be added here if needed in the future */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <DashboardHeader title="Tools" user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    