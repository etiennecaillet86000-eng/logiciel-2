export const DEFAULT_FRAIS_VARIABLES = [
 {id:"commissions",nom:"Commissions de paiement",mode:"pct_ca",valeur:1.5,forfait:0,quantite:0,actif:true,aide:"Frais prélevés par les cartes bancaires et plateformes; estimation en % du CA HT."},
 {id:"emballages",nom:"Emballages",mode:"par_ticket",valeur:0.35,forfait:0,quantite:0,actif:true,aide:"Sacs, boîtes et couverts à emporter; coût moyen par ticket."},
 {id:"energie-activite",nom:"Énergie liée à l’activité",mode:"pct_ca",valeur:1,forfait:0,quantite:0,actif:true,aide:"Part variable des consommations selon le volume de ventes; évitez de recompter la part déjà inscrite en frais fixes."},
 {id:"consommables",nom:"Consommables",mode:"par_couvert",valeur:0.2,forfait:0,quantite:0,actif:true,aide:"Produits d’entretien et petits consommables par couvert servi."},
 {id:"maintenance",nom:"Maintenance et extras",mode:"forfait_variable",valeur:0.5,forfait:60,quantite:0,actif:true,aide:"Petit forfait mensuel, complété par une part du CA pour interventions ou extras."},
 {id:"carburant",nom:"Carburant / livraisons",mode:"usage",valeur:0.2,forfait:0,quantite:0,unite:"km",actif:false,aide:"Saisissez les kilomètres mensuels prévus et le coût estimé par kilomètre."},
];
export function coutFraisVariables(items=[],{ca=0,tickets=0,couverts=0,inflation=1}={}){return (items||[]).filter(x=>x&&x.actif!==false).reduce((s,x)=>{const v=Math.max(0,Number(x.valeur)||0),f=Math.max(0,Number(x.forfait)||0),q=Math.max(0,Number(x.quantite)||0);let c=0;switch(x.mode){case"pct_ca":c=ca*v/100;break;case"par_ticket":c=tickets*v;break;case"par_couvert":c=couverts*v;break;case"usage":c=q*v;break;case"forfait_variable":c=f+ca*v/100;break;case"forfait":c=f||v;break;}return s+c*inflation;},0);}
export function normalizeFraisVariables(value){return Array.isArray(value)?value.map((x,i)=>({...DEFAULT_FRAIS_VARIABLES.find(d=>d.id===x?.id),...x,id:x?.id||`frais-${i}`})):DEFAULT_FRAIS_VARIABLES.map(x=>({...x}));}

export function coutVariableTotal(items=[],legacy={},ctx={}){const detailed=coutFraisVariables(items,ctx);const pct=Math.max(0,Number(legacy.pctCA)||0),per=Math.max(0,Number(legacy.parTicket)||0);return detailed+(Number(ctx.ca)||0)*pct/100+(Number(ctx.tickets)||0)*per;}

export function initialiserFraisVariablesDetail(value,legacy={}){if(Array.isArray(value))return normalizeFraisVariables(value);const hasLegacy=(Number(legacy.pctCA)||0)>0||(Number(legacy.parTicket)||0)>0;return normalizeFraisVariables(undefined).map(x=>hasLegacy?{...x,actif:false}:x);}
