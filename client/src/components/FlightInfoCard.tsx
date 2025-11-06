import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

type Detail = {
  label: string;
  value: React.ReactNode;
};

type FlightInfoCardProps = {
  flightNo: string;
  airlineName: string;
  airlineCode?: string;
  originCode: string;
  originName?: string | null;
  destinationCode: string;
  destinationName?: string | null;
  details?: Detail[];
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function FlightInfoCard({
  flightNo,
  airlineName,
  airlineCode,
  originCode,
  originName,
  destinationCode,
  destinationName,
  details,
  headerAction,
  footer,
  className,
}: FlightInfoCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{flightNo}</div>
            <div className="text-muted-foreground text-sm">
              {airlineName}
              {airlineCode ? ` (${airlineCode})` : ""}
            </div>
          </div>
          {headerAction}
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Route</div>
          <div className="text-lg font-medium">
            {originCode} → {destinationCode}
          </div>
          <div className="text-xs text-muted-foreground">
            {originName ?? "-"} to {destinationName ?? "-"}
          </div>
        </div>

        {details && details.length > 0 ? (
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {details.map((detail) => (
              <React.Fragment key={detail.label}>
                <div className="text-muted-foreground">{detail.label}</div>
                <div className="font-medium">{detail.value}</div>
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {footer ? <div className="pt-4 border-t">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
