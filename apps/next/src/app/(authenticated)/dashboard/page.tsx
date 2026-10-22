"use client";
import DashboardContent from "@/app/(authenticated)/dashboard/dashboard-content";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
