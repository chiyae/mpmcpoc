
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

const toolsLinks = [
    {
        href: '/tools/procurement-assistant',
        icon: ShoppingCart,
        title: 'Procurement Assistant',
        description: 'Assist in the process of procuring medicines by comparing prices from different vendors and generating LPOs based on the best price.'
    },
]

export default function ToolsDashboard() {
  return (
    <div className="space-y-6">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
            <p className="text-muted-foreground">
                Access powerful assistants and utilities to streamline your workflow.
            </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {toolsLinks.map((link) => (
                 <Link href={link.href} key={link.title}>
                    <Card className="hover:bg-card-foreground/5 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <link.icon className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>{link.title}</CardTitle>
                                <CardDescription className="mt-1">{link.description}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                 </Link>
            ))}
        </div>
    </div>
  );
}
