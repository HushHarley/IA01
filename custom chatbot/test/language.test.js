import test from "node:test";
import assert from "node:assert/strict";
import { detectLanguage } from "../src/utils/language.js";

test("French remains the default for an ambiguous first message", () => {
  assert.equal(detectLanguage("DNS", "fr", true), "fr");
});

test("a clearly English first message selects English", () => {
  assert.equal(detectLanguage("Hi, can you help with my Wi-Fi?", "fr", true), "en");
});

test("an explicit English request switches from French", () => {
  assert.equal(detectLanguage("Can we continue in English?", "fr", false), "en");
});

test("an explicit French request switches from English", () => {
  assert.equal(detectLanguage("Peut-on continuer en français?", "en", false), "fr");
});

test("a French sentence can request English", () => {
  assert.equal(detectLanguage("Peux-tu répondre en anglais?", "fr", false), "en");
});

test("an English sentence can request French", () => {
  assert.equal(detectLanguage("Can we switch back to French?", "en", false), "fr");
});

test("short technical follow-ups preserve the active language", () => {
  assert.equal(detectLanguage("ipconfig", "en", false), "en");
});
