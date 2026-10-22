"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, EyeOff } from "lucide-react";
import Link from "next/link";

export function NoPeriodCard({
  message = "Select a period to view trial balance.",
}: {
  message?: string;
}) {
  return (
    <Card className="border-dashed py-16 text-center">
      <CardContent className="space-y-3">
        <EyeOff size={36} className="mx-auto text-muted-foreground" />
        <h3 className="font-semibold text-ui">No Period Selected</h3>
        <p className="text-ui text-muted-foreground">{message}</p>
        <Button asChild size="sm">
          <Link href="/periods" className="gap-1.5 text-caption">
            <Calendar size={14} /> Go to Periods
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
