import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  switchHref,
  switchLabel,
}: {
  title: string;
  subtitle: string;
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="text-primary" size={22} /> {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <Button asChild variant="outline" size="sm" className="text-sm">
        <Link href={switchHref}>{switchLabel}</Link>
      </Button>
    </div>
  );
}
