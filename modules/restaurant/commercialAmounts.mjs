export const roundMoney = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
export const ttcToHt = (ttc, rate) => roundMoney(Number(ttc || 0) / (1 + Number(rate || 0) / 100));
export const htToTtc = (ht, rate) => roundMoney(Number(ht || 0) * (1 + Number(rate || 0) / 100));
export function normalizeCommercialLine(line) {
  const rate = [5.5, 10].includes(Number(line.tva)) ? Number(line.tva) : 10;
  const ttc = line.prixTTC != null ? roundMoney(line.prixTTC) : htToTtc(line.prixHT, rate);
  const ht = ttcToHt(ttc, rate);
  return { ...line, tva: rate, prixTTC: ttc, prixHT: ht };
}
export function commercialTotals(lines) {
  return lines.map(normalizeCommercialLine).reduce((sum, line) => {
    const ht = roundMoney(line.prixHT * (Number(line.quantite) || 0));
    const ttc = roundMoney(line.prixTTC * (Number(line.quantite) || 0));
    return { ht: roundMoney(sum.ht + ht), tva: roundMoney(sum.tva + ttc - ht), ttc: roundMoney(sum.ttc + ttc) };
  }, { ht: 0, tva: 0, ttc: 0 });
}
