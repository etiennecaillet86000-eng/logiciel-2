export const PAYMENT_MODES = ["Espèces", "Carte", "Virement", "Chèque"];
export function matchesCommercialDocument(doc, query) {
  const q = String(query || "").trim().toLowerCase().replace(/\s/g, ""); if (!q) return true;
  const date = String(doc.date || ""); const fr = date ? `${date.slice(8,10)}/${date.slice(5,7)}/${date.slice(0,4)}` : "";
  return [doc.client, doc.numero, date, fr].some(v => String(v || "").toLowerCase().replace(/\s/g, "").includes(q));
}
export function eligibleCommercialPayments(journal) {
  const ticketLinked = new Set((journal?.documents || []).filter(d => d.journalTicketId).map(d => d.id));
  return (journal?.encaissementsClients || []).filter(e => !ticketLinked.has(e.factureId));
}
export function addCommercialPayments(totals, payments, range) {
  const result = { ...totals, encaissements: { ...(totals.encaissements || {}) } };
  let net = Number(result.net) || 0;
  for (const e of payments || []) if (!e.journalTicketId && e.date >= range.start && e.date <= range.end) {
    result.caHT += Number(e.ht) || 0; result.caTTC += Number(e.ttc) || 0;
    const mode = e.mode || "Non renseigné"; result.encaissements[mode] = (result.encaissements[mode] || 0) + (Number(e.ttc) || 0); net += Number(e.ttc) || 0;
  }
  result.net = net; return result;
}
export function migrateCommercialDocuments(documents) {
  return (Array.isArray(documents) ? documents : []).map((source) => {
    const d = { ...source, lines: Array.isArray(source.lines) ? source.lines : [] };
    d.type = d.type === "facture" ? "facture" : "devis";
    if (d.type === "facture") {
      const old = String(d.statut || "").toLowerCase();
      d.statut = ["payée", "payé", "paid"].includes(old) ? "Payé"
        : ["envoyé", "envoyée", "émise", "emise", "en retard", "à payer", "a payer", "en cours de paiement"].includes(old) ? "En cours de paiement" : "En cours de paiement";
      d.dateEnvoi = d.dateEnvoi || (["envoyé", "envoyée", "émise", "emise", "en retard", "à payer", "a payer"].includes(old) ? (d.date || "") : "");
      d.datePaiement = d.datePaiement || "";
      d.paiement = PAYMENT_MODES.includes(d.paiement) ? d.paiement : "";
    } else {
      const old = String(d.statut || "").toLowerCase();
      d.statut = ["livré", "livree", "livrée", "bon de livraison", "livraison"].includes(old) || source.type === "livraison" ? "Bon de livraison"
        : old === "accepté" || old === "accepte" ? "Accepté"
        : old === "refusé" || old === "refuse" ? "Refusé" : "Envoyé";
    }
    d.factureLieeId = d.factureLieeId || (d.type === "devis" ? "" : (d.devisLieId || d.sourceDocumentId || ""));
    d.devisLieId = d.devisLieId || (d.type === "facture" ? (d.sourceDocumentId || "") : "");
    return d;
  });
}
export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export function vatBreakdown(lines = []) {
  const groups = new Map();
  for (const line of lines) {
    const rate = Number(line.tva) || 0, unitHT = roundMoney(Number(line.prixHT) || 0), quantity = Number(line.quantite) || 0;
    const ht = roundMoney(unitHT * quantity), tva = roundMoney(roundMoney(unitHT * rate / 100) * quantity);
    const key = String(rate), entry = groups.get(key) || { taux: rate, ht: 0, tva: 0, ttc: 0 };
    entry.ht += ht; entry.tva += tva; entry.ttc += ht + tva; groups.set(key, entry);
  }
  return [...groups.values()];
}
export function totals(lines = []) {
  return lines.reduce((a, l) => {
    const unitHT = roundMoney(Number(l.prixHT) || 0);
    const quantity = Number(l.quantite) || 0;
    const ht = roundMoney(unitHT * quantity);
    const tva = roundMoney(roundMoney(unitHT * (Number(l.tva) || 0) / 100) * quantity);
    return { ht: a.ht + ht, tva: a.tva + tva, ttc: a.ttc + ht + tva };
  }, { ht: 0, tva: 0, ttc: 0 });
}
export function applyDeliveryStock(doc, recipes, ingredients, movements, idFactory, date = doc.date) {
  if (Array.isArray(doc.mouvementIds) && doc.mouvementIds.length) return doc.mouvementIds;
  const created = [];
  for (const line of doc.lines || []) {
    const recipe = (recipes || []).find((r) => r.id === line.recetteId);
    if (!recipe) continue;
    for (const item of recipe.ingredients || []) {
      if (!(ingredients || []).some((i) => i.id === item.ingredientId)) continue;
      const id = idFactory(); created.push(id);
      movements.push({ id, ingredientId: item.ingredientId, date, typeOp: "Sortie", quantite: (Number(item.quantite) || 0) * (Number(line.quantite) || 0), motif: `Bon de livraison — ${doc.numero || doc.id}`, documentId: doc.id, commercialDocumentId: doc.id });
    }
  }
  doc.mouvementIds = created;
  return created;
}
export function reverseDeliveryStock(doc, movements) {
  const ids = new Set(doc.mouvementIds || []);
  const before = movements.length;
  for (let i = movements.length - 1; i >= 0; i--) if (ids.has(movements[i].id) || movements[i].commercialDocumentId === doc.id) movements.splice(i, 1);
  doc.mouvementIds = [];
  return before - movements.length;
}
export function cancelDelivery(documents, encaissements, movements, id, options = {}) {
  const quote = documents.find((d) => d.id === id);
  if (!quote || quote.type === "facture") throw new Error("Bon de livraison introuvable");
  const invoice = documents.find((d) => d.id === quote.factureLieeId || d.devisLieId === quote.id);
  if (invoice?.statut === "Payé" && !options.confirmPaid) throw new Error("La facture est payée : confirmez l’annulation du paiement et du bon de livraison.");
  if (invoice) {
    encaissements.splice(0, encaissements.length, ...encaissements.filter((e) => e.factureId !== invoice.id));
    documents.splice(documents.indexOf(invoice), 1);
  }
  reverseDeliveryStock(quote, movements);
  quote.statut = quote.statutAvantBL || "Accepté";
  quote.statutAvantBL = ""; quote.factureLieeId = "";
  return { quote, deletedInvoice: invoice || null, reversedStock: true };
}
export function deleteCommercialDocument(documents, encaissements, movements, id, options = {}) {
  const doc = documents.find((d) => d.id === id);
  if (!doc) return false;
  if (doc.type !== "facture") {
    if (doc.statut === "Bon de livraison" || doc.factureLieeId) return cancelDelivery(documents, encaissements, movements, id, options);
    documents.splice(documents.indexOf(doc), 1); return true;
  }
  if (doc.statut === "Payé" && !options.confirmPaid) throw new Error("La facture est payée : confirmez la suppression et l’annulation de l’encaissement.");
  encaissements.splice(0, encaissements.length, ...encaissements.filter((e) => e.factureId !== doc.id));
  documents.splice(documents.indexOf(doc), 1);
  if (doc.devisLieId || doc.sourceDocumentId) {
    const quote = documents.find((d) => d.id === (doc.devisLieId || doc.sourceDocumentId));
    if (quote) { reverseDeliveryStock(quote, movements); quote.statut = quote.statutAvantBL || "Accepté"; quote.statutAvantBL = ""; quote.factureLieeId = ""; }
  }
  return true;
}
function nextNumber(docs, type, date) {
  const year = String(date || new Date().toISOString().slice(0, 10)).slice(0, 4);
  const prefix = type.toUpperCase();
  const max = docs.filter(x => x.type === type && String(x.date || "").startsWith(year))
    .reduce((n, x) => Math.max(n, Number(String(x.numero || "").split("-").at(-1)) || 0), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}
export function applyCommercialTransition(documents, encaissements, id, statut, options = {}, stockContext = null) {
  const doc = documents.find(x => x.id === id);
  if (!doc) throw new Error("Document introuvable");
  const today = options.today || new Date().toISOString().slice(0, 10);
  if (doc.type === "facture") {
    if (statut === "Envoyé") statut = "En cours de paiement";
    if (!["En cours de paiement", "Payé"].includes(statut)) throw new Error("Statut de facture invalide");
    if (statut === "En cours de paiement") {
      doc.statut = statut;
      doc.dateEnvoi = options.dateEnvoi || doc.dateEnvoi || today;
      encaissements.splice(0, encaissements.length, ...encaissements.filter(x => x.factureId !== doc.id));
      doc.encaissementId = "";
      doc.datePaiement = "";
      return { doc, createdInvoice: null, payment: null };
    }
    const mode = options.modePaiement || doc.paiement;
    const datePaiement = options.datePaiement || today;
    if (!PAYMENT_MODES.includes(mode)) throw new Error("Choisissez un mode de paiement (espèces, carte, virement ou chèque).");
    if (!datePaiement) throw new Error("Saisissez la date de paiement.");
    doc.statut = "Payé"; doc.datePaiement = datePaiement; doc.paiement = mode;
    const amount = totals(doc.lines);
    let payment = encaissements.find(x => x.factureId === doc.id);
    if (!payment) {
      payment = { id: `enc-${doc.id}`, factureId: doc.id, numeroFacture: doc.numero, client: doc.client, date: datePaiement, mode, ht: amount.ht, tva: amount.tva, ttc: amount.ttc, tvaParTaux: vatBreakdown(doc.lines), lines: doc.lines.map(x => ({ ...x })) };
      encaissements.push(payment);
    } else Object.assign(payment, { date: datePaiement, mode, ht: amount.ht, tva: amount.tva, ttc: amount.ttc, client: doc.client, numeroFacture: doc.numero, mode, tvaParTaux: vatBreakdown(doc.lines), lines: doc.lines.map(x => ({ ...x })) });
    doc.encaissementId = payment.id;
    return { doc, createdInvoice: null, payment };
  }
  if (!["Envoyé", "Refusé", "Accepté", "Bon de livraison"].includes(statut)) throw new Error("Statut de devis invalide");
  const previousStatus = doc.statut;
  doc.statut = statut;
  if (statut === "Bon de livraison" && previousStatus !== "Bon de livraison") doc.statutAvantBL = previousStatus === "Bon de livraison" ? (doc.statutAvantBL || "Accepté") : previousStatus;
  if (statut !== "Bon de livraison") return { doc, createdInvoice: null, payment: null };
  let invoice = documents.find(x => x.type === "facture" && x.devisLieId === doc.id);
  if (!invoice) {
    const date = doc.date || today;
    invoice = { id: `facture-${doc.id}`, type: "facture", numero: nextNumber(documents, "facture", date), date, client: doc.client, statut: "En cours de paiement", dateEnvoi: today, datePaiement: "", paiement: "", lines: doc.lines.map(x => ({ ...x })), devisLieId: doc.id, sourceDocumentId: doc.id, factureLieeId: "", encaissementId: "", createdAt: new Date().toISOString() };
    documents.push(invoice);
  }
  doc.factureLieeId = invoice.id;
  if (stockContext) applyDeliveryStock(doc, stockContext.recipes, stockContext.ingredients, stockContext.movements, stockContext.idFactory, options.dateLivraison || today);
  return { doc, createdInvoice: invoice, payment: null };
}
