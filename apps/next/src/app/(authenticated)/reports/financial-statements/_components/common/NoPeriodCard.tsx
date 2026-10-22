"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, EyeOff } from "lucide-react";
import Link from "next/link";

export function NoPeriodCard() {
  return (
    <Card className="py-16 text-center border-dashed">
      <CardContent className="space-y-3">
        <EyeOff size={36} className="mx-auto text-muted-foreground" />
        <h3 className="font-semibold text-ui">No Period Selected</h3>
        <Button asChild size="sm">
          <Link href="/periods" className="gap-1.5 text-caption">
            <Calendar size={14} /> Go to Periods
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
