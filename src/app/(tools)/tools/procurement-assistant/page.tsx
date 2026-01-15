
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card";

export default function ProcurementAssistantPage() {
  return (
    <div className="space-y-6">
        <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">Procurement Assistant</h1>
            <p className="text-muted-foreground">
                A step-by-step tool to help you build, price, and generate purchase orders.
            </p>
        </header>

        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>This feature is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>The procurement workflow will be implemented here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
