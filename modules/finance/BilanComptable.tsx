import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { readJournal } from "@/backend";
import { balanceSummary } from "@/modules/restaurant/bilanMath.mjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjectionStore } from "@/core/store/projectionStore";
import { capitalRestantApresNMois, totalDotationsParAnnee, totalInteretsAnnuel } from "@/core/utils/finance";
import { calculateProjectionTax, getTaxRates } from "@/core/utils/taxRates";
import { calculerEquilibreBilan, sommeMontants } from "@/core/utils/balanceCalculations";
import { getScenarioCoefficient } from "@/core/utils/projectionMath";
import { useAmortissements, useAssociesGerants, useEmprunts, useFraisFixes, useRecettes, useSalaries, useVentesRecettes, useParametresJuridiques } from "@/hooks/useQueries";
import { useIngredients, useMouvementsStock } from "@/hooks/useRestaurantQueries";
import { fmtEur } from "@/utils/format";
import { venteHT, venteCout } from "@/modules/restaurant/journalMath";

type Ligne = { nom: string; montant: number; aide: string };
type Source = "reel" | "mix";
const euro = (n: number) => fmtEur(Number.isFinite(n) ? n : 0);

function TableBilan({ titre, lignes, total }: { titre: string; lignes: Ligne[]; total: number }) {
  return <Card className="overflow-hidden"><CardHeader className="border-b bg-muted/20 pb-3"><CardTitle className="text-base">{titre}</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Rubrique</TableHead><TableHead className="hidden md:table-cell">À quoi cela correspond</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader><TableBody>{lignes.map((l) => <TableRow key={l.nom}><TableCell className="font-medium">{l.nom}</TableCell><TableCell className="hidden md:table-cell text-xs text-muted-foreground">{l.aide}</TableCell><TableCell className="text-right font-mono">{euro(l.montant)}</TableCell></TableRow>)}<TableRow className="border-t-2 bg-muted/40 font-bold"><TableCell colSpan={2}>TOTAL {titre.toLocaleUpperCase("fr-FR")}</TableCell><TableCell className="text-right font-mono">{euro(total)}</TableCell></TableRow></TableBody></Table></CardContent></Card>;
}
function Equilibre({ actif, passif }: { actif: number; passif: number }) {
  const b = calculerEquilibreBilan(actif, passif);
  return <div className={`rounded-xl border px-4 py-3 ${b.equilibre ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}><div className="flex flex-wrap items-center justify-between gap-2"><strong>{b.equilibre ? "✓ Actif = passif" : "⚠ Écart à expliquer"}</strong><Badge variant="outline">Écart actif − passif : {euro(b.ecart)}</Badge></div><p className="mt-1 text-sm font-medium">Ligne de contrôle — écart non justifié : {euro(b.ecart)}. {b.equilibre ? "Équilibre dans la tolérance d’arrondi." : "Ne pas forcer l’équilibre : vérifier les comptes manquants."}</p><p className="mt-1 text-xs text-muted-foreground">Un bilan complet doit être équilibré. Les rubriques sans données de caisse, de factures ouvertes ou de déclarations sont indiquées comme estimations : contrôlez-les avec votre comptable.</p></div>;
}

function BilanReel() {
  const { data: amortissements = [] } = useAmortissements(); const { data: emprunts = [] } = useEmprunts();
  const { data: associes = [] } = useAssociesGerants(); const { data: recettes = [] } = useRecettes();
  const { data: ingredients = [] } = useIngredients(); const { data: mouvements = [] } = useMouvementsStock();
  const { data: ventes = [] } = useVentesRecettes(); const { data: journal = {tickets:[],factures:[],documents:[],encaissementsClients:[]} } = useQuery({queryKey:["journal"],queryFn:async()=>readJournal()});
  const [annee, setAnnee] = useState(1); const [manual,setManual]=useState<Record<string,number>>({}); const [tiers,setTiers]=useState(false); const [selected,setSelected]=useState("");
  const recipeParId = useMemo(() => new Map(recettes.map(r => [r.id, r])), [recettes]);
  const stockQte = new Map(ingredients.map(i => [i.id,i.stockInitial]));
  for (const m of mouvements) stockQte.set(m.ingredientId,(stockQte.get(m.ingredientId)??0)+(m.typeOp === "Entrée" ? m.quantite : -m.quantite));
  const stock = sommeMontants(ingredients.map(i => Math.max(0,stockQte.get(i.id)??0)*i.prixUnitaireHT));
  const immosBrutes = sommeMontants(amortissements.map(a => a.coutTotal)); const amortCumule = sommeMontants(amortissements.map(a => totalDotationsParAnnee([a],annee))); const immosNettes = Math.max(0,immosBrutes-amortCumule);
  const capital = associes.reduce((s,a) => s+(a.apportCapital??0),0);
  const result=ventes.reduce((s,v)=>s+venteHT(v,recettes),0)-ventes.reduce((s,v)=>s+venteCout(v,recettes),0)-totalDotationsParAnnee(amortissements,annee);
  const now = new Date(); const empruntsRestants = emprunts.reduce((s,e) => {const age=Math.max(0,(now.getFullYear()-Number(e.dateDebut.slice(0,4)))*12+now.getMonth()+1-Number(e.dateDebut.slice(5,7)));return s+capitalRestantApresNMois(e,Math.min(age,Number(e.dureeMois)+Number(e.differeMois)));},0);
  const cashTickets=(journal.tickets||[]).reduce((s,t)=>s+(Number(t.totalTTC)||0),0); const cashClient=(journal.encaissementsClients||[]).reduce((s,e)=>s+(Number(e.ttc)||0),0);
  const paidBuys=(journal.factures||[]).filter(f=>(f.statut==="Payée"||f.statut==="Payé"||!f.statut)&&(f.datePaiement||f.date||"")<=now.toISOString().slice(0,10)).reduce((s,f)=>s+(f.lines||[]).reduce((a,l)=>a+(Number(l.quantite)||0)*(Number(l.prixUnitaireHT)||0)*(1+(Number(l.tva)||0)/100),0),0);
  const balance=balanceSummary({documents:journal.documents||[],invoices:journal.factures||[],cash:cashTickets+cashClient-paidBuys,stock,loans:empruntsRestants,fixedAssets:immosNettes,capital,result,associateAccounts:0,taxSocial:0,manual});
  const details=(name:string)=> name==="Créances clients"?(journal.documents||[]).filter((d:any)=>d.type==="facture"&&d.statut!=="Payé").map((d:any)=>`${d.numero} · ${d.client} · ${d.statut}`):name==="Dettes fournisseurs"?(journal.factures||[]).filter((f:any)=>f.statut==="À payer"||f.statut==="A payer").map((f:any)=>`${f.fournisseur} · ${f.date} · ${f.statut}`):name==="Immobilisations nettes"?amortissements.map((a:any)=>`${a.nom||a.libelle||"Immobilisation"} · coût ${euro(Number(a.coutTotal)||0)}`):name==="Stocks"?ingredients.map(i=>`${i.nom} · ${Math.max(0,stockQte.get(i.id)??0)} ${i.unite}`):name==="Emprunts et dettes financières"?emprunts.map((e:any)=>`${e.nom||e.libelle||"Emprunt"} · solde restant estimé`):name==="Capital et résultat"?associes.map((a:any)=>`${a.nom} · apport au capital ${euro(Number(a.apportCapital)||0)}`):name==="Trésorerie"?[`${(journal.tickets||[]).length} tickets; encaissements factures clients et achats payés du Journal`]:["Montant estimatif à renseigner; détail non disponible dans les données actuelles."];
  const rows=(items:any[])=>items.map((line:any)=><details key={line.name} className="border-b px-3 py-2"><summary className="grid cursor-pointer list-none grid-cols-[1fr_130px] items-center gap-2"><span title={line.name==="Créances clients"?"Factures envoyées non réglées":line.name==="Dettes fournisseurs"?"Achats enregistrés mais non payés":"Montant estimé depuis les données disponibles"} className="font-medium">{line.name} ⓘ</span><span className="text-right font-mono">{euro(line.amount)}</span></summary><div className="space-y-2 py-2 pl-3 text-xs text-muted-foreground"><p>{line.name==="Créances clients"?"Ce sont les factures client qui restent à encaisser.":line.name==="Dettes fournisseurs"?"Ce sont les achats du Journal marqués À payer.":"Montant calculé depuis les données disponibles; vous pouvez le corriger ci-dessous."}</p><ul className="list-disc pl-4">{details(line.name).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul><label className="flex max-w-sm items-center gap-2">Ajustement manuel (facultatif)<Input aria-label={`Ajustement ${line.name}`} type="number" step="0.01" value={manual[line.name]??line.amount} onChange={e=>setManual({...manual,[line.name]:Number(e.target.value)})}/></label></div></details>);
  const totalA=balance.totalA,totalP=balance.totalP;
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Bilan simplifié dynamique</h3><p className="text-sm text-muted-foreground">Estimation de gestion, modifiable poste par poste. Les valeurs corrigées restent dans cette session.</p></div><Select value={String(annee)} onValueChange={v=>setAnnee(Number(v))}><SelectTrigger className="w-48"><SelectValue/></SelectTrigger><SelectContent>{[1,2,3,4,5].map(x=><SelectItem key={x} value={String(x)}>Année {x} (amortissements)</SelectItem>)}</SelectContent></Select></div>
  <div className={`rounded-xl border px-4 py-3 ${balance.equilibre?"border-emerald-500/30 bg-emerald-500/10":"border-amber-500/30 bg-amber-500/10"}`}><strong>{balance.equilibre?"✓ Actif = passif":"⚠ Écart à expliquer"}</strong><span className="float-right">Écart : {euro(balance.ecart)}</span><p className="mt-1 text-sm">Un écart signale des éléments non saisis ou une estimation à ajuster. Ce n’est pas un logiciel comptable.</p></div>
  <div className="grid gap-4 lg:grid-cols-2">{[["ACTIF",balance.actif,totalA],["PASSIF",balance.passif,totalP]].map(([title,items,total]:any)=><Card key={title} className="overflow-hidden"><CardHeader className="border-b bg-muted/20"><CardTitle>{title}</CardTitle><p className="text-xs text-muted-foreground">{title==="ACTIF"?"Ce que l’entreprise possède ou doit recevoir.":"Comment ces biens sont financés et ce qui reste à payer."}</p></CardHeader><CardContent className="p-0">{rows(items)}<div className="flex justify-between bg-muted/40 p-3 font-bold">TOTAL {title}<span>{euro(total)}</span></div></CardContent></Card>)}</div>
  <Card><CardHeader><CardTitle className="flex items-center justify-between">Tiers <Button variant="outline" onClick={()=>setTiers(!tiers)}>{tiers?"Masquer":"Afficher les tiers"}</Button></CardTitle><p className="text-xs text-muted-foreground">Clients, fournisseurs, associés et banque : mouvements identifiables à partir du Journal et des fiches.</p></CardHeader>{tiers&&<CardContent className="space-y-3"><div className="flex flex-wrap gap-2">{[...new Set([...(journal.documents||[]).map((d:any)=>d.client),...(journal.factures||[]).map((f:any)=>f.fournisseur),...associes.map(a=>a.nom),"Banque / caisse"])].filter(Boolean).map((name:any)=><Button key={name} size="sm" variant={selected===name?"default":"outline"} onClick={()=>setSelected(name)}>{name}</Button>)}</div>{selected&&<div className="rounded border p-3 text-sm"><b>{selected}</b><ul className="mt-2 space-y-1">{(journal.documents||[]).filter((d:any)=>d.client===selected).map((d:any)=><li key={d.id}>Client · {d.numero} · {d.date} · {d.statut}</li>)}{(journal.factures||[]).filter((f:any)=>f.fournisseur===selected).map((f:any)=><li key={f.id}>Fournisseur · {f.date} · {f.statut}</li>)}{associes.filter(a=>a.nom===selected).map((a:any)=><li key={a.id}>Associé · apport {euro(Number(a.apportCapital)||0)}</li>)}{selected==="Banque / caisse"&&<li>Encaissements tickets : {euro(cashTickets)} · factures clients : {euro(cashClient)} · achats payés : {euro(paidBuys)}</li>}</ul></div>}</CardContent>}</Card>
  <p className="text-xs text-muted-foreground">Les factures clients ouvertes et dettes fournisseurs proviennent du Journal. Les emprunts et immobilisations sont estimés par échéanciers. Les comptes courants et dettes fiscales/sociales ne sont pas enregistrés par les modules courants : utilisez l’ajustement manuel. Le bilan n’est pas certifié.</p></div>;
}

function BilanPrevisionnel() {
  const [source,setSource]=useState<Source>("reel");
  const { params,mixCategories,businessPlanParams,calendrierExploitation }=useProjectionStore();
  const { data: frais=[] }=useFraisFixes(); const { data: salaires=[] }=useSalaries();
  const { data: associes=[] }=useAssociesGerants(); const { data: amortissements=[] }=useAmortissements(); const { data: emprunts=[] }=useEmprunts();
  const active=associes.filter(a=>a.typeAssocie!=="investisseur");
  const chargesSal=salaires.reduce((s,x)=>s+x.salaireAnnuelBrut*(1+getTaxRates().patronalesSalaries/100),0)+active.reduce((s,x)=>s+x.remunerationAnnuelle,0)+active.reduce((s,x)=>s+x.remunerationAnnuelle*(x.statut==="assimile"?getTaxRates().assimileSalarie:getTaxRates().tns)/100,0);
  const fraisAn=frais.reduce((s,x)=>s+x.montantMensuelAvecRemu,0)*12+chargesSal;
  const jours=(calendrierExploitation?.joursOuvertureParSemaine??6)*(calendrierExploitation?.semainesOuvertureParAn??52);
  const coefficient=getScenarioCoefficient(params.scenario);
  const caAnnuel=(params.couvertsDejeunner+params.couvertsDiner)*(params.tauxRemplissage/100)*params.ticketMoyen*coefficient*jours;
  const mixMarge=mixCategories.reduce((s,x)=>s+x.pctCA*x.margeBruteAvg,0)/(mixCategories.reduce((s,x)=>s+x.pctCA,0)||100);
  const margeBrute=source==="mix" ? mixMarge : 100-(params.foodCostRatio||0);
  const amortBase=totalDotationsParAnnee(amortissements,1);
  const interestBase=totalInteretsAnnuel(emprunts,0);
  const capital=associes.reduce((s,a)=>s+(a.apportCapital??0),0);
  const croissance=businessPlanParams.growthCoefficient5ans||1;
  const rows=Array.from({length:5},(_,i)=>{
    const growth=croissance**i, ca=caAnnuel*growth, cmp=ca*(1-margeBrute/100), charges=fraisAn*growth;
    const amor=totalDotationsParAnnee(amortissements,i+1), interets=totalInteretsAnnuel(emprunts,i*12);
    const avantIs=ca-cmp-charges-amor-interets, resultat=avantIs-calculateProjectionTax(avantIs);
    const immo=Math.max(0,sommeMontants(amortissements.map(a=>a.coutTotal))-Array.from({length:i+1},(_,j)=>totalDotationsParAnnee(amortissements,j+1)).reduce((a,b)=>a+b,0));
    const dette=emprunts.reduce((s,e)=>s+capitalRestantApresNMois(e,Math.min((i+1)*12,Number(e.dureeMois)+Number(e.differeMois))),0);
    const resultatCumule=Array.from({length:i+1},(_,j)=>{
      const g=croissance**j, cy=caAnnuel*g, cm=cy*(1-margeBrute/100), ch=fraisAn*g;
      const op=cy-cm-ch-totalDotationsParAnnee(amortissements,j+1)-totalInteretsAnnuel(emprunts,j*12);
      return op-calculateProjectionTax(op);
    }).reduce((a,b)=>a+b,0);
    const cash=capital+resultatCumule+dette-immo;
    const actifs=[{nom:"Immobilisations nettes",montant:immo,aide:"Coût des équipements diminué des amortissements projetés cumulés."},{nom:"Stocks et créances",montant:0,aide:"Non projetés faute de rotation de stock et de délais clients paramétrés."},{nom:"Trésorerie projetée",montant:cash,aide:"Résultats nets cumulés moins remboursements de capital modélisés; à interpréter comme une approximation."}];
    const passifs=[{nom:"Capital apporté",montant:capital,aide:"Apports déclarés dans Associés & Gérants."},{nom:"Réserves et résultats cumulés",montant:resultatCumule,aide:"Résultats nets prévisionnels cumulés, supposés conservés dans l’entreprise."},{nom:"Emprunts restant dus",montant:dette,aide:"Capital restant estimé à partir des échéanciers existants."},{nom:"Dettes fournisseurs, fiscales et sociales",montant:0,aide:"Non projetées car aucune échéance fournisseur ou déclarative n’est stockée."}];
    return {annee:i+1,actifs,passifs,actif:sommeMontants(actifs.map(x=>x.montant)),passif:sommeMontants(passifs.map(x=>x.montant)),ca,resultat};
  });
  const [year,setYear]=useState("1"); const row=rows[Number(year)-1];
  return <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">Bilan prévisionnel</h3><p className="text-sm text-muted-foreground">Projection annuelle sur cinq ans, selon les hypothèses actuelles du Business plan.</p></div><div className="flex flex-wrap gap-2"><Select value={source} onValueChange={v=>setSource(v as Source)}><SelectTrigger className="w-56"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="reel">Business plan réel</SelectItem><SelectItem value="mix">Rentabilité mix produits</SelectItem></SelectContent></Select><Select value={year} onValueChange={setYear}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent>{rows.map(r=><SelectItem key={r.annee} value={String(r.annee)}>Année {r.annee}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Chiffre d’affaires projeté</p><p className="mt-1 text-lg font-semibold">{euro(row.ca)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Résultat net estimé</p><p className="mt-1 text-lg font-semibold">{euro(row.resultat)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Source de marge</p><p className="mt-1 text-lg font-semibold">{source==="reel"?"Business plan réel":"Mix produits"}</p></CardContent></Card></div><Equilibre actif={row.actif} passif={row.passif}/><div className="grid gap-4 lg:grid-cols-2"><TableBilan titre={`Actif — année ${row.annee}`} lignes={row.actifs} total={row.actif}/><TableBilan titre={`Passif — année ${row.annee}`} lignes={row.passifs} total={row.passif}/></div><p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground"><strong>Comment lire ce bilan ?</strong> L’actif correspond aux biens et ressources; le passif indique leur financement (capital, résultats, dettes). Les montants non suivis par l’application ne sont pas inventés; l’écart signale les postes manquants ou les hypothèses incompatibles. Les résultats fiscaux utilisent le régime IR/IS choisi et les taux estimatifs modifiables.</p><p className="text-xs text-muted-foreground">Le Business plan réel reprend les hypothèses de couverts, ticket, saisonnalité et scénario, avec le taux de matières paramétré. La Rentabilité mix produits utilise la marge pondérée du mix enregistré. La source sélectionnée fait varier cette marge. Il s’agit d’une simulation, pas d’un bilan certifié.</p></div>;
}

export default function BilanComptable() {
  const [partie,setPartie]=useState<"dynamique"|"previsionnel">("dynamique");
  return <section className="space-y-5"><div className="flex flex-wrap gap-2 rounded-lg bg-muted/40 p-1 w-fit"><Button size="sm" variant={partie==="dynamique"?"default":"ghost"} onClick={()=>setPartie("dynamique")}>Bilan comptable</Button><Button size="sm" variant={partie==="previsionnel"?"default":"ghost"} onClick={()=>setPartie("previsionnel")}>Bilan prévisionnel</Button><Button size="sm" variant="outline" onClick={()=>window.print()}>Imprimer / PDF</Button></div>{partie==="dynamique"?<BilanReel/>:<BilanPrevisionnel/>}</section>;
}
