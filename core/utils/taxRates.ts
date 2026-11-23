export const TAX_RATES_KEY = "gestion_resto_taux_fiscaux_v2";
export interface TaxRates {
  tns:number; assimileSalarie:number; chargesSalariales:number; patronalesSalaries:number;
  isReduit:number; isNormal:number; ir:number; flatTaxDividendes:number; prelevementsSociaux:number;
  seuilIsReduit:number; tvaNormale:number; tvaIntermediaire:number; tvaReduite:number; irTranches:{plafond:number|null;taux:number}[];
}
export const DEFAULT_TAX_RATES:TaxRates={tns:45,assimileSalarie:42,chargesSalariales:22,patronalesSalaries:42,isReduit:15,isNormal:25,ir:45,flatTaxDividendes:31.4,prelevementsSociaux:18.6,seuilIsReduit:42500,tvaNormale:20,tvaIntermediaire:10,tvaReduite:5.5,irTranches:[{plafond:11600,taux:0},{plafond:29579,taux:11},{plafond:84577,taux:30},{plafond:181917,taux:41},{plafond:null,taux:45}]};
export function getTaxRates():TaxRates { try {const v=JSON.parse(localStorage.getItem(TAX_RATES_KEY)||"{}"); return {...DEFAULT_TAX_RATES,...v,irTranches:Array.isArray(v.irTranches)?v.irTranches:DEFAULT_TAX_RATES.irTranches};}catch{return DEFAULT_TAX_RATES;} }
export function saveTaxRates(v:TaxRates):void {localStorage.setItem(TAX_RATES_KEY,JSON.stringify(v));}
export function calcTnsCharges(remu:number,rates=getTaxRates()){return remu*rates.tns/100;}
export function calcEmployerCharges(brut:number,rates=getTaxRates()){return brut*rates.patronalesSalaries/100;}
export function calculateIS(profit:number,rates=getTaxRates()){const p=Math.max(0,profit);return Math.min(p,rates.seuilIsReduit)*rates.isReduit/100+Math.max(0,p-rates.seuilIsReduit)*rates.isNormal/100;}
export function calculateTaxForRegime(profit:number,regime:string|undefined,rates=getTaxRates()){return String(regime||"IR").toUpperCase().includes("IS")?calculateIS(profit,rates):calculateIR(profit,rates);}
export function getSavedTaxRegime():string {try {const raw=localStorage.getItem("gestion-resto-local-v1");return (raw?JSON.parse(raw)?.parametresJuridiques?.regimeFiscal:null)||"IR";}catch{return "IR";}}
export function calculateProjectionTax(profit:number,rates=getTaxRates()){return calculateTaxForRegime(profit,getSavedTaxRegime(),rates);}
export function calculateIR(income:number,rates=getTaxRates()){const revenu=Math.max(0,income);let base=0,impot=0;for(const t of rates.irTranches){const max=t.plafond===null?Infinity:t.plafond;impot+=Math.max(0,Math.min(revenu,max)-base)*t.taux/100;if(revenu<=max)break;base=max;}return impot;}
export function distributeDividends(total:number,owners:{partsCapital?:number}[]){return owners.map(o=>total*(Number(o.partsCapital)||0)/100);}
export function capitalSharesValid(owners:{partsCapital?:number}[]){return Math.abs(owners.reduce((s,o)=>s+(Number(o.partsCapital)||0),0)-100)<0.005;}
