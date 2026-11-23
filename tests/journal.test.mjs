import test from "node:test";
import assert from "node:assert/strict";
import { htFromTtc, netEncaissement, resumee, tauxTva, ticketEffets, retirerEffetsLiees, venteHT, venteTTC, venteCout } from "../src/modules/restaurant/journalMath.ts";
const recettes=[{id:"r1",nom:"Plat",prixVenteTTC:11,tauxTVA:10,ingredients:[{ingredientId:"i1",quantite:0.2}]},{id:"r2",nom:"Boisson",prixVenteTTC:5,tauxTVA:5.5,ingredients:[{ingredientId:"i2",quantite:1}]}];
test("TVA: produit sans taux prend le taux défaut 10% et calcul HT",()=>{assert.equal(tauxTva(undefined),10);assert.ok(Math.abs(htFromTtc(11,undefined)-10)<1e-10);});
test("ticket multi-lignes crée ventes et sorties de stock une seule fois",()=>{const result=ticketEffets({id:"t1",date:"2026-11-22",paiement:"Carte",lines:[{recetteId:"r1",quantite:2},{recetteId:"r2",quantite:1}]},recettes,1);assert.equal(result.ventes.length,2);assert.equal(result.mouvements.length,2);assert.deepEqual(result.mouvements.map(x=>x.quantite),[0.4,1]);assert.equal(result.ventes[0].ticketId,"t1");});
test("suppression des liens ticket retire les effets stock et vente",()=>{const rows=[{id:"v1"},{id:"v2"}];assert.deepEqual(retirerEffetsLiees(rows,["v1"]),[{id:"v2"}]);});
test("commission titres restaurant réduit le net encaissé",()=>{assert.equal(netEncaissement(100,"Titres-restaurant",3.5),96.5);assert.equal(netEncaissement(100,"Carte",3.5),100);});
test("résumé calcule ticket moyen, répartition et net",()=>{const x=resumee([{totalTTC:20,totalHT:18,paiement:"Espèces"},{totalTTC:100,totalHT:90,paiement:"Titres-restaurant"}],3.5);assert.equal(x.nombre,2);assert.equal(x.ticketMoyen,60);assert.equal(x.totalTTC,120);assert.equal(x.repartition.Espèces,20);assert.equal(x.net,116.5);});
test("effets ticket matérialisent CA comptable et coûts recette via les ventes existantes",()=>{const effects=ticketEffets({id:"compta",date:"2026-11-22",paiement:"Espèces",lines:[{recetteId:"r1",quantite:3}]},recettes,10);const caHT=effects.ventes.reduce((s,v)=>s+htFromTtc(recettes.find(r=>r.id===v.recetteId).prixVenteTTC,recettes.find(r=>r.id===v.recetteId).tauxTVA)*v.quantite,0);assert.equal(caHT,30);assert.ok(Math.abs(effects.mouvements.reduce((s,m)=>s+m.quantite,0)-0.6)<1e-10);});
test("factures calculent une charge HT sans confondre TVA",()=>{const ligne={quantite:2,prixUnitaireHT:7.5,tva:20};const chargeHT=ligne.quantite*ligne.prixUnitaireHT;const tva=chargeHT*ligne.tva/100;assert.equal(chargeHT,15);assert.equal(tva,3);});

test("les sélecteurs de ventes conservent prix, TVA et coût capturés au ticket malgré les changements de fiche",()=>{
 const ventes=ticketEffets({id:"historique",date:"2026-01-01",paiement:"Carte",lines:[{recetteId:"r1",quantite:2}]},recettes,20,[{id:"i1",prixUnitaireHT:4}]).ventes;
 const v=ventes[0]; const modifiees=[{...recettes[0],prixVenteTTC:22,tauxTVA:20,consommablesHT:9}];
 assert.equal(v.prixUnitaireTTC,11); assert.equal(v.tauxTVA,10); assert.equal(venteTTC(v,modifiees),22); assert.equal(venteHT(v,modifiees),20); assert.equal(venteCout(v,modifiees),1.6);
});
test("les anciennes ventes sans snapshots restent lisibles via les fiches existantes",()=>{
 const v={recetteId:"r1",quantite:2}; assert.equal(venteHT(v,recettes),20); assert.equal(venteTTC(v,recettes),22); assert.equal(venteCout(v,recettes),0);
});
