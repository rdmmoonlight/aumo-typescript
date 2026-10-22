"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEME_OPTIONS = [
  { id: "light", label: "Light", desc: "Terang", icon: Sun },
  { id: "dark", label: "Dark", desc: "Gelap", icon: Moon },
  { id: "system", label: "System", desc: "Ikut OS", icon: Monitor },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-ui">Appearance</CardTitle>
        <CardDescription className="text-caption">
          Pilih tema antarmuka.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <RadioGroup
          value={mounted ? theme : "system"}
          onValueChange={setTheme}
          className="grid grid-cols-3 gap-2.5"
        >
          {THEME_OPTIONS.map(({ id, label, desc, icon: Icon }) => {
            const active = mounted && theme === id;
            return (
              <Label
                key={id}
                htmlFor={id}
                className={cn(
                  "relative flex flex-col rounded-lg border p-3 cursor-pointer hover:bg-accent/50",
                  active ? "border-primary bg-primary/5" : "border-muted",
                )}
              >
                <RadioGroupItem value={id} id={id} className="sr-only" />
                <Icon
                  size={16}
                  className={cn("mb-2", active && "text-primary")}
                />
                <span className="text-caption font-medium">{label}</span>
                <span className="text-caption text-muted-foreground">
                  {desc}
                </span>
                {active && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check size={10} />
                  </div>
                )}
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
export default AppearanceSection;
