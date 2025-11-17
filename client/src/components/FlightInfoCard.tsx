import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

const normalizeLabel = (label?: string | null) =>
  typeof label === "string" ? label.trim().toLowerCase() : "";

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
  const priceDetail = details?.find(
    (detail) => normalizeLabel(detail.label) === "price"
  );
  const departureDetail = details?.find(
    (detail) => normalizeLabel(detail.label) === "departure"
  );
  const arrivalDetail = details?.find(
    (detail) => normalizeLabel(detail.label) === "arrival"
  );
  const detailItems =
    details?.filter(
      (detail) =>
        detail !== priceDetail &&
        detail !== departureDetail &&
        detail !== arrivalDetail
    ) ?? [];
  const priceValue = priceDetail?.value;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Route</div>
            <div className="text-lg font-medium">
              {originCode} → {destinationCode}
            </div>
            <div className="text-xs text-muted-foreground">
              {originName ?? "-"} to {destinationName ?? "-"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="text-sm text-muted-foreground">
              {airlineName}
              {airlineCode ? ` (${airlineCode})` : ""}
            </div>
            <div className="text-xl font-semibold">{flightNo}</div>
            {headerAction ? <div className="pt-1">{headerAction}</div> : null}
          </div>
        </div>
        {departureDetail || arrivalDetail ? (
          <div className="flex flex-wrap items-center gap-24 text-sm">
            {departureDetail ? (
              <div>
                <div className="text-muted-foreground">
                  {departureDetail.label}
                </div>
                <div className="font-medium">{departureDetail.value}</div>
              </div>
            ) : null}
            {arrivalDetail ? (
              <div>
                <div className="text-muted-foreground">
                  {arrivalDetail.label}
                </div>
                <div className="font-medium">{arrivalDetail.value}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {detailItems.length > 0 ? (
          <div className="inline-grid grid-cols-[auto_auto] gap-x-6 gap-y-2 text-sm">
            {detailItems.map((detail) => (
              <React.Fragment key={detail.label}>
                <div className="text-muted-foreground">{detail.label}</div>
                <div className="font-medium">{detail.value}</div>
              </React.Fragment>
            ))}
          </div>
        ) : null}

        {priceValue || footer ? (
          <div className="pt-4 border-t space-y-3">
            {priceValue ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Price
                </div>
                <div className="text-lg font-semibold">
                  {priceValue}
                </div>
              </div>
            ) : null}
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
