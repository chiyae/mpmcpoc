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
import { Home, DollarSign, FileText, Settings, LogOut } from "lucide-react";
import Logo from "@/components/logo";
import DashboardHeader from "@/components/dashboard-header";


export default function BillingLayout({ children }: { children: ReactNode }) {
  const user = { name: "Billing User", role: "Billing", avatarUrl: "https://picsum.photos/seed/12/100/100" };
  
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
                <Link href="/billing/dashboard">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Invoices">
                <Link href="#">
                  <FileText />
                  <span>Invoices</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Patient Billing">
                <Link href="/billing/patient-billing">
                  <DollarSign />
                  <span>Patient Billing</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Logout">
                <Link href="/">
                  <LogOut />
                  <span>Logout</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <DashboardHeader title="Billing" user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
