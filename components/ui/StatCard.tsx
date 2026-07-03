import { cn } from "@/lib/utils";
import { Card } from "./Card";
import type { IconProps } from "@/components/icons";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconTone = "blue",
}: {
  label: string;
  value: string;
  icon: (props: IconProps) => React.JSX.Element;
  trend?: string;
  iconTone?: "blue" | "green" | "amber" | "violet";
}) {
  const toneClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            toneClasses[iconTone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && <p className="mt-3 text-xs text-slate-500">{trend}</p>}
    </Card>
  );
}
