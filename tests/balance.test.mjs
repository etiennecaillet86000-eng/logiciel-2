import test from "node:test";
import assert from "node:assert/strict";
import { calculerEquilibreBilan, sommeMontants } from "../src/core/utils/balanceCalculations.ts";

test("bilan équilibré quand actif et passif sont égaux", () => {
  const result = calculerEquilibreBilan(125000, 125000);
  assert.equal(result.ecart, 0);
  assert.equal(result.equilibre, true);
});

test("bilan signale l’écart positif ou négatif au-delà d’un euro", () => {
  assert.deepEqual(calculerEquilibreBilan(125010, 125000), {
    totalActif: 125010, totalPassif: 125000, ecart: 10, equilibre: false,
  });
  assert.equal(calculerEquilibreBilan(10, 20).ecart, -10);
});

test("les montants composant actif et passif se somment sans perdre les valeurs négatives", () => {
  const actif = sommeMontants([12000, 3500, 0]);
  const passif = sommeMontants([8000, 5000, 2500]);
  assert.equal(calculerEquilibreBilan(actif, passif).equilibre, true);
  assert.equal(sommeMontants([4, -2]), 2);
});
