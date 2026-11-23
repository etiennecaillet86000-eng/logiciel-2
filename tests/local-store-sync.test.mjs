import test from "node:test";
import assert from "node:assert/strict";
import { shouldPersistActorCall } from "../src/core/store/localStoreSync.ts";

const readMethods = { getIngredients: "ingredients", getRecettes: "recettes" };

test("les requêtes de lecture n’écrivent pas le stockage et évitent l’invalidation récursive", () => {
  assert.equal(shouldPersistActorCall("getIngredients", readMethods), false);
  assert.equal(shouldPersistActorCall("getRecettes", readMethods), false);
  assert.equal(shouldPersistActorCall("createIngredient", readMethods), true);
});

test("les mutations restent persistées et signalées", () => {
  const events = [];
  const fakeWrite = (method) => {
    if (shouldPersistActorCall(method, readMethods)) events.push("gestion-resto:data-changed");
  };
  fakeWrite("getIngredients");
  assert.deepEqual(events, []);
  fakeWrite("createIngredient");
  assert.deepEqual(events, ["gestion-resto:data-changed"]);
});
