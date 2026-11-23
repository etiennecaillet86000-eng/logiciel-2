import test from 'node:test'; import assert from 'node:assert/strict';
import {ttcToHt,htToTtc,commercialTotals,normalizeCommercialLine} from '../src/modules/restaurant/commercialAmounts.mjs';
test('conversion TTC vers HT et TVA autorisée, arrondis au centime',()=>{assert.equal(ttcToHt(10.55,5.5),10);assert.equal(ttcToHt(11,10),10);assert.equal(htToTtc(10,5.5),10.55);assert.equal(normalizeCommercialLine({prixTTC:10.55,tva:5.5}).prixHT,10);});
test('document legacy stocké HT converti en TTC sans changer son montant HT',()=>{assert.deepEqual(commercialTotals([{prixHT:10,quantite:2,tva:10}]),{ht:20,tva:2,ttc:22});});
