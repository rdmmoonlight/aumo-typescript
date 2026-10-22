"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="text-ui">
      <AlertTriangle size={16} />
      <AlertDescription className="text-caption">{message}</AlertDescription>
    </Alert>
  );
}
