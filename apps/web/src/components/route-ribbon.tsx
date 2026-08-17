interface RouteRibbonProps {
  readonly compact?: boolean;
  readonly destination: string;
  readonly origin: string;
}

export function RouteRibbon({
  compact = false,
  destination,
  origin,
}: RouteRibbonProps) {
  return (
    <div className={`route-ribbon${compact ? " route-ribbon-compact" : ""}`}>
      <div className="route-point">
        <span>Berangkat dari</span>
        <strong>{origin}</strong>
      </div>
      <div className="route-track" aria-hidden="true">
        <span />
      </div>
      <div className="route-point route-point-destination">
        <span>Tiba di</span>
        <strong>{destination}</strong>
      </div>
    </div>
  );
}
