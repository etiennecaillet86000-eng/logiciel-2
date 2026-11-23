import type { Recette, VenteRecette } from "@/hooks/useRestaurantQueries";
import { venteCout, venteHT, venteTTC, netEncaissement } from "./journalMath";
import { addCommercialPayments, eligibleCommercialPayments } from "./commercialDocuments.mjs";

export type JournalData = { tickets: any[]; factures: any[]; pertes: any[]; encaissementsClients?: any[]; parametres?: { commissionTitres?: number } };
export type Range = { start: string; end: string };
export type PeriodTotals = { caHT:number; caTTC:number; tickets:number; ticketMoyen:number; cout:number; marge:number; pertes:number; achats:number; encaissements:Record<string,number>; net:number };
export function inRange(date:string,range:Range){return date>=range.start&&date<=range.end;}
export function sumPeriod(range:Range, sales:VenteRecette[], recipes:Recette[], journal:JournalData):PeriodTotals {
 const commission=Number(journal.parametres?.commissionTitres??3.5), recipesArr=[...recipes];
 const tickets=(journal.tickets||[]).filter(t=>inRange(t.date,range));
 const ticketIds=new Set((journal.tickets||[]).map(t=>t.id));
 const legacy=sales.filter(v=>inRange(v.date,range)&&!(v as any).ticketId);
 let caHT=0,caTTC=0,cout=0,net=0; const encaissements:Record<string,number>={"Espèces":0,"Carte":0,"Titres-restaurant":0,"Non renseigné":0};
 for(const t of tickets){caHT+=Number(t.totalHT)||0;caTTC+=Number(t.totalTTC)||0;const mode=t.paiement||"Non renseigné";encaissements[mode]=(encaissements[mode]||0)+(Number(t.totalTTC)||0);}
 for(const v of legacy){caHT+=venteHT(v,recipesArr);caTTC+=venteTTC(v,recipesArr);cout+=venteCout(v,recipesArr);const mode=(v as any).moyenPaiement||"Non renseigné";encaissements[mode]=(encaissements[mode]||0)+venteTTC(v,recipesArr);}
 const ticketSales=sales.filter(v=>inRange(v.date,range)&&(v as any).ticketId&&ticketIds.has((v as any).ticketId));
 for(const v of ticketSales) cout+=venteCout(v,recipesArr);
 const ticketCount=tickets.length+legacy.length;
 const pertes=(journal.pertes||[]).filter(p=>inRange(p.date,range)).reduce((s,p)=>s+(Number(p.valeurHT)||Number(p.coutHT)||0),0);
 const achats=(journal.factures||[]).filter(f=>inRange(f.date,range)).reduce((s,f)=>s+(f.lines||[]).reduce((n:number,l:any)=>n+(Number(l.quantite)||0)*(Number(l.prixUnitaireHT)||0),0),0);
 for(const t of tickets)net+=netEncaissement(Number(t.totalTTC)||0,t.paiement||"",commission);
 for(const v of legacy){const mode=(v as any).moyenPaiement||"";const gross=venteTTC(v,recipesArr);net+=netEncaissement(gross,mode,commission);}
 const combined=addCommercialPayments({caHT,caTTC,encaissements,net},eligibleCommercialPayments(journal),range);
 caHT=combined.caHT;caTTC=combined.caTTC;net=combined.net;
 for(const mode of Object.keys(encaissements))encaissements[mode]=combined.encaissements[mode]||0;
 return {caHT,caTTC,tickets:ticketCount,ticketMoyen:ticketCount?caTTC/ticketCount:0,cout,marge:caHT-cout,pertes,achats,encaissements,net};
}
export function monthRange(year:number,month:number):Range {const start=new Date(year,month,1),end=new Date(year,month+1,0);return {start:dateKey(start),end:dateKey(end)};}
export function yearRange(year:number):Range{return {start:`${year}-01-01`,end:`${year}-12-31`};}
export function dayRange(date:string):Range{return {start:date,end:date};}
export function dateKey(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
export function lossTotal(range:Range,journal:JournalData,recipes:Recette[],ingredients:any[]){return (journal.pertes||[]).filter(p=>inRange(p.date,range)).reduce((sum,p)=>{if(p.type==="ingredient"){const ing=ingredients.find(i=>i.id===p.ingredientId);return sum+(Number(ing?.prixUnitaireHT)||0)*(Number(p.quantite)||0);}const r=recipes.find(x=>x.id===p.recetteId);return sum+(Number(r?.consommablesHT)||0)*(Number(p.quantite)||0);},0);}
