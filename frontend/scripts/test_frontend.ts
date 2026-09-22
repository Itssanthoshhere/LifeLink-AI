/**
 * Frontend automated unit and integration test runner.
 * Tests contract schemas, mock fallbacks, scenario catalog, and data transforms.
 */

import assert from "node:assert";
import test from "node:test";

import {
  MOCK_COMMAND_CENTER,
  MOCK_NETWORK,
  MOCK_INVENTORY,
  MOCK_HOSPITAL_INTELLIGENCE,
  SCENARIO_CATALOG
} from "../src/lib/mockData";

test("Scenario catalog contains exactly 9 operational stress scenarios", () => {
  assert.strictEqual(SCENARIO_CATALOG.length, 9);
  const ids = SCENARIO_CATALOG.map((s) => s.id);
  assert.ok(ids.includes("normal"));
  assert.ok(ids.includes("demand_spike"));
  assert.ok(ids.includes("mass_casualty"));
  assert.ok(ids.includes("dengue_outbreak"));
  assert.ok(ids.includes("o_negative_crisis"));
  assert.ok(ids.includes("cooling_failure"));
  assert.ok(ids.includes("transport_cut"));
  assert.ok(ids.includes("platelet_expiry_wave"));
  assert.ok(ids.includes("donor_slump"));
});

test("Network mock contains 30 hospitals and 10 blood banks", () => {
  assert.strictEqual(MOCK_NETWORK.nodes.total_hospitals, 30);
  assert.strictEqual(MOCK_NETWORK.nodes.total_blood_banks, 10);
  assert.ok(MOCK_NETWORK.nodes.hospitals.length >= 12);
  assert.strictEqual(MOCK_NETWORK.nodes.blood_banks.length, 10);
  assert.ok(MOCK_NETWORK.routes.length > 0);
  assert.strictEqual(typeof MOCK_NETWORK.metrics.avg_distance_km, "number");
});

test("Command center metrics enforce 100% emergency protection and positive transfers", () => {
  const m = MOCK_COMMAND_CENTER.network_metrics;
  assert.strictEqual(m.emergency_protection_rate_pct, 100.0);
  assert.strictEqual(m.total_shortage_units_after, 0.0);
  assert.ok(m.total_units_transferred > 0);
  assert.ok(m.total_donor_units_mobilized > 0);
  assert.ok(m.fefo_expiring_units_rescued > 0);
});

test("Decision breakdown sums to total evaluated demands", () => {
  const d = MOCK_COMMAND_CENTER.decision_breakdown;
  const sum = d.transfer_only + d.donor_only + d.combined + d.no_action_needed;
  assert.strictEqual(sum, d.total_demands_evaluated);
});

test("Shortage alerts format has valid risk tiers and probabilities", () => {
  assert.ok(MOCK_COMMAND_CENTER.shortage_alerts.length > 0);
  for (const alert of MOCK_COMMAND_CENTER.shortage_alerts) {
    assert.ok(alert.shortage_probability >= 0 && alert.shortage_probability <= 1.0);
    assert.ok(["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(alert.risk_level));
    assert.ok(alert.hospital_id.startsWith("HOSP_"));
  }
});

test("Model 3 synthetic donors never contain real PII", () => {
  const donors = MOCK_COMMAND_CENTER.donor_recommendations;
  assert.ok(donors.length > 0);
  for (const d of donors) {
    for (const c of d.top_candidates) {
      assert.ok(c.donor_id.startsWith("DONOR_"));
      assert.strictEqual(typeof c.distance_km, "number");
      assert.ok(c.composite_score >= 0 && c.composite_score <= 1.0);
      assert.strictEqual(typeof c.medical_clearance, "boolean");
      assert.ok(c.days_since_last_donation >= 90);
    }
  }
});

test("Engine 4 explanations contain constraint states and plain-English rationales", () => {
  const expl = MOCK_COMMAND_CENTER.explanations;
  assert.ok(expl.length > 0);
  const e1 = expl[0].explanation;
  assert.ok(e1.hospital_condition.hospital_id);
  assert.ok(e1.source_condition.transferable_inventory >= 0);
  assert.ok(e1.logistics_feasibility.eta_minutes > 0);
  assert.ok(e1.summary_rationale.length > 20);
});

test("Inventory snapshot balances total stock and reserves", () => {
  const inv = MOCK_INVENTORY;
  assert.ok(inv.summary.total_units > 0);
  assert.ok(inv.summary.total_safety_reserve > 0);
  assert.ok(inv.summary.usable_excess > 0);
  assert.strictEqual(
    Math.round(inv.summary.total_units - inv.summary.total_safety_reserve),
    Math.round(inv.summary.usable_excess)
  );
});

test("Hospital Intelligence drawer payload matches HOSP_007 structure", () => {
  const h = MOCK_HOSPITAL_INTELLIGENCE;
  assert.strictEqual(h.hospital_id, "HOSP_007");
  assert.strictEqual(h.overall_risk_status, "CRITICAL");
  assert.ok(h.inventory.length > 0);
  assert.ok(h.incoming_transfers.length > 0);
  assert.ok(h.nearby_blood_banks.length > 0);
});

test("Disclaimer banner is explicitly present", () => {
  assert.ok(MOCK_COMMAND_CENTER.disclaimer.includes("DECISION SUPPORT PROTOTYPE"));
});
