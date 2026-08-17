import type { ReactNode } from "react";

export function SimulationNote({ children }: { readonly children: ReactNode }) {
  return (
    <aside className="simulation-note" aria-label="Keterangan prototipe">
      <span aria-hidden="true">SIM</span>
      <p>{children}</p>
    </aside>
  );
}
