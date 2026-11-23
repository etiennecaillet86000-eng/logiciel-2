export const PAYMENT_MODES: string[];
export function migrateCommercialDocuments(documents: any): any[];
export function roundMoney(value: number): number;
export function totals(lines?: any[]): { ht: number; tva: number; ttc: number };
export function applyDeliveryStock(doc: any, recipes: any[], ingredients: any[], movements: any[], idFactory: () => string, date?: string): string[];
export function reverseDeliveryStock(doc: any, movements: any[]): number;
export function cancelDelivery(documents: any[], encaissements: any[], movements: any[], id: string, options?: any): any;
export function deleteCommercialDocument(documents: any[], encaissements: any[], movements: any[], id: string, options?: any): boolean | any;
export function applyCommercialTransition(documents: any[], encaissements: any[], id: string, statut: string, options?: any, stockContext?: any): { doc: any; createdInvoice: any; payment: any };

export function matchesCommercialDocument(doc: any, query: string): boolean;
export function addCommercialPayments(totals: any, payments: any[], range: any): any;

export function eligibleCommercialPayments(journal: any): any[];

export function vatBreakdown(lines?: any[]): { taux: number; ht: number; tva: number; ttc: number }[];
