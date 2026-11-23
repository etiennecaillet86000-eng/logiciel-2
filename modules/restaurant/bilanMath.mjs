export function monthPeriod(year, month) { const y=Number(year), m=Number(month); if(!Number.isInteger(y)||!Number.isInteger(m)||m<1||m>12)return null; const start=`${y}-${String(m).padStart(2,'0')}-01`; const end=new Date(y,m,0).getDate(); return {start,end:`${y}-${String(m).padStart(2,'0')}-${String(end).padStart(2,'0')}`}; }
export function customPeriod(start,end) { if(!start||!end||start>end)return null; return {start,end}; }
export function balanceSummary({documents=[],invoices=[],cash=0,stock=0,loans=0,fixedAssets=0,capital=0,result=0,associateAccounts=0,taxSocial=0,manual={}}={}) {
 const openReceivables=documents.filter(d=>d.type==='facture'&&d.statut!=='Payé').reduce((s,d)=>s+(d.lines||[]).reduce((n,l)=>n+Math.round(((Number(l.prixHT)||0)*(Number(l.quantite)||0)*(1+(Number(l.tva)||0)/100)+Number.EPSILON)*100)/100,0),0);
 const unpaidSuppliers=invoices.filter(i=>i.statut==='À payer'||i.statut==='A payer').reduce((s,i)=>s+(i.lines||[]).reduce((n,l)=>n+(Number(l.quantite)||0)*(Number(l.prixUnitaireHT)||0)*(1+(Number(l.tva)||0)/100),0),0);
 const actif=[['Immobilisations nettes',fixedAssets],['Stocks',stock],['Créances clients',openReceivables],['Trésorerie',cash]].map(([name,auto])=>({name,amount:Number(manual[name]??auto)||0}));
 const passif=[['Capital et résultat',Number(capital||0)+Number(result||0)],['Comptes courants d’associés',associateAccounts],['Emprunts et dettes financières',loans],['Dettes fournisseurs',unpaidSuppliers],['Dettes fiscales et sociales',taxSocial]].map(([name,auto])=>({name,amount:Number(manual[name]??auto)||0}));
 const totalA=actif.reduce((s,x)=>s+x.amount,0),totalP=passif.reduce((s,x)=>s+x.amount,0); return {actif,passif,totalA,totalP,ecart:Math.round((totalA-totalP)*100)/100,equilibre:Math.abs(totalA-totalP)<0.01};
}
