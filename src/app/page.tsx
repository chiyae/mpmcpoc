import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pill, Warehouse } from "lucide-react";
import Logo from "@/components/logo";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center mb-12">
        <Logo className="text-5xl font-bold justify-center mb-2" />
        <p className="text-muted-foreground text-lg">
          Your lightweight inventory management system for clinics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/bulk-store/dashboard">
          <Card className="hover:border-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Warehouse className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">
                Bulk Store
              </CardTitle>
              <CardDescription>
                Manage main inventory, stock transfers, and internal orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-primary font-semibold">
                Enter Bulk Store
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dispensary/dashboard">
          <Card className="hover:border-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-accent/10 rounded-full mb-4">
                <Pill className="w-10 h-10 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl font-headline">
                Dispensary
              </CardTitle>
              <CardDescription>
                Dispense items, handle patient billing, and manage local stock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-primary font-semibold">
                Enter Dispensary
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MediTrack Pro. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
