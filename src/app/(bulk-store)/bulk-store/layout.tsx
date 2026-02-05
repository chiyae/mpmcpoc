
'use client';

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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Home, Package, Truck, LineChart, Settings, LogOut, ClipboardCheck } from "lucide-react";
import Logo from "@/components/logo";
import DashboardHeader from "@/components/dashboard-header";
import { useAppUser } from "@/hooks/use-app-user";


export default function BulkStoreLayout({ children }: { children: ReactNode }) {
  const { user } = useAppUser();
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/bulk-store/dashboard">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Inventory">
                <Link href="/bulk-store/inventory">
                  <Package />
                  <span>Inventory</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Internal Orders">
                <Link href="/bulk-store/internal-orders">
                  <Truck />
                  <span>Internal Orders</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Reports">
                <Link href="/bulk-store/reports">
                  <LineChart />
                  <span>Reports</span>
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
        <DashboardHeader title="Bulk Store" user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
