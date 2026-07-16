import test from "node:test";
import assert from "node:assert/strict";
import { __liveServiceTest } from "../src/services/liveService.js";

test("live status rejects private and local endpoints", () => {
  assert.equal(__liveServiceTest.safeStatusUrl("http://127.0.0.1:30120/players.json"), "");
  assert.equal(__liveServiceTest.safeStatusUrl("http://10.0.0.5/players.json"), "");
  assert.equal(__liveServiceTest.safeStatusUrl("http://localhost/players.json"), "");
});

test("live status allows public http and https endpoints", () => {
  assert.equal(__liveServiceTest.safeStatusUrl("https://status.example.com/players.json"), "https://status.example.com/players.json");
  assert.equal(__liveServiceTest.safeStatusUrl("http://status.example.com/players.json"), "http://status.example.com/players.json");
});
