export interface BalanceTotals {
  totalActif: number;
  totalPassif: number;
  ecart: number;
  equilibre: boolean;
}

/** Écart signé = actif moins passif ; tolérance d'arrondi d'un euro. */
export function calculerEquilibreBilan(
  totalActif: number,
  totalPassif: number,
  tolerance = 1,
): BalanceTotals {
  const actif = Number.isFinite(totalActif) ? totalActif : 0;
  const passif = Number.isFinite(totalPassif) ? totalPassif : 0;
  const ecart = actif - passif;
  return {
    totalActif: actif,
    totalPassif: passif,
    ecart,
    equilibre: Math.abs(ecart) < tolerance,
  };
}

export function sommeMontants(montants: number[]): number {
  return montants.reduce((total, montant) => total + (Number.isFinite(montant) ? montant : 0), 0);
}
