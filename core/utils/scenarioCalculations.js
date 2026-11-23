/** Calcule les charges patronales estimées pour un dirigeant rémunéré. */
export function coutRemunerationDirigeant(remuneration, statut, rates) {
 const brut=Math.max(0,Number(remuneration)||0);
 if(statut === "investisseur") return {remuneration:0,cotisations:0,coutTotal:0};
 if(statut === "assimile") {const c=brut*(Number(rates.assimileSalarie)||0)/100; return {remuneration:brut,cotisations:c,coutTotal:brut+c};}
 const c=brut*(Number(rates.tns)||0)/100; return {remuneration:brut,cotisations:c,coutTotal:brut+c};
}
export function calculerCotisationsAssocies(associes, rates, pacteActif=true) {
 if(!pacteActif) return 0;
 return associes.reduce((total,a)=>total+coutRemunerationDirigeant(a.remunerationAnnuelle,a.typeAssocie==="investisseur"?"investisseur":a.statut,rates).cotisations,0);
}
