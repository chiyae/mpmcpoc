import { cn } from "@/lib/utils";
import { PlusSquare } from "lucide-react";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PlusSquare className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-foreground">
        MediTrack Pro
      </h1>
    </div>
  );
}
