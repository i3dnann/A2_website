import test from "node:test";
import assert from "node:assert/strict";
import { __contractTest } from "../src/services/contractService.js";

test("participant contract view strips internal administrator notes", () => {
  const contract = __contractTest.publicContractView({
    id: "contract-1",
    version: {
      id: "version-1",
      internal_admin_notes: "private staff notes",
      content: { purpose: "public" },
    },
  });

  assert.equal(contract.version.internal_admin_notes, "");
  assert.equal(contract.version.content.purpose, "public");
});
