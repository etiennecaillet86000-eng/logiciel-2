import test from "node:test";
import assert from "node:assert/strict";
import { coutFraisVariables, coutVariableTotal, normalizeFraisVariables, initialiserFraisVariablesDetail, DEFAULT_FRAIS_VARIABLES } from "../src/core/utils/fraisVariables.js";
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} !== ${b}`);
test("calcul variable par pourcentage, ticket, couvert et usage",()=>{
 const items=[{mode:"pct_ca",valeur:2},{mode:"par_ticket",valeur:.5},{mode:"par_couvert",valeur:.2},{mode:"usage",valeur:.3,quantite:100}];
 close(coutFraisVariables(items,{ca:1000,tickets:50,couverts:40}),20+25+8+30);
});
test("forfait seul et forfait complété par un pourcentage",()=>{
 close(coutFraisVariables([{mode:"forfait",forfait:75,valeur:10},{mode:"forfait_variable",forfait:40,valeur:1.5}],{ca:2000}),75+70);
});
test("désactivation, inflation et valeurs invalides non négatives",()=>{
 close(coutFraisVariables([{mode:"pct_ca",valeur:3},{mode:"pct_ca",valeur:100,actif:false},{mode:"usage",valeur:-1,quantite:5}],{ca:200,inflation:1.1}),6.6);
});
test("coût total additionne détails et anciens réglages pour compatibilité",()=>{
 close(coutVariableTotal([{mode:"pct_ca",valeur:1}],{pctCA:2,parTicket:1},{ca:1000,tickets:10}),40);
});
test("normalisation conserve options historiques et fournit les valeurs par défaut",()=>{
 const legacy=normalizeFraisVariables(undefined);assert.equal(legacy.length,DEFAULT_FRAIS_VARIABLES.length);assert.equal(legacy.find(x=>x.id==="carburant").actif,false);
 const custom=normalizeFraisVariables([{id:"commissions",valeur:2}]);assert.equal(custom[0].valeur,2);assert.equal(custom[0].mode,"pct_ca");
});

test("migration des anciens frais évite de compter une seconde fois les taux configurés",()=>{
 const legacy=initialiserFraisVariablesDetail(undefined,{pctCA:4,parTicket:.5});assert.ok(legacy.every(x=>x.actif===false));
 const fresh=initialiserFraisVariablesDetail(undefined,{});assert.ok(fresh.some(x=>x.actif));
});
