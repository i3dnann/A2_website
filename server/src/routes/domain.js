import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createResource, listResource } from "../services/repository.js";
import { getQbPlayerByCitizenId, searchQbPlayers } from "../services/qbcore.js";
import { auditAction } from "../services/audit.js";

export function createDomainRouter({ viewPermission, editPermission, resources = [], searchMode = "citizen" }) {
  const router = Router();
  router.use(requireAuth, requirePermission(viewPermission));

  router.get("/dashboard", asyncHandler(async (_req, res) => {
    const results = await Promise.all(resources.map((resource) => listResource(resource, { limit: 5 })));
    res.json({
      cards: results.map((result, index) => ({ label: resources[index], value: result.total })),
      resources: Object.fromEntries(resources.map((resource, index) => [resource, results[index].rows]))
    });
  }));

  router.get("/search", asyncHandler(async (req, res) => {
    const players = searchMode === "citizen" ? await searchQbPlayers({ q: req.query.q || "", citizenid: req.query.citizenid || "", phone: req.query.phone || "", license: req.query.license || "" }) : [];
    res.json({ players });
  }));

  router.get("/citizen/:id", asyncHandler(async (req, res) => {
    const player = await getQbPlayerByCitizenId(req.params.id);
    if (!player) return res.status(404).json({ error: "citizen_not_found" });
    res.json({ player });
  }));

  router.get("/patient/:id", asyncHandler(async (req, res) => {
    const player = await getQbPlayerByCitizenId(req.params.id);
    if (!player) return res.status(404).json({ error: "patient_not_found" });
    res.json({ player });
  }));

  resources.forEach((resource) => {
    router.get(`/${resource}`, asyncHandler(async (req, res) => {
      const { rows, total } = await listResource(resource, { q: req.query.q || "", limit: req.query.limit || 25, offset: req.query.offset || 0 });
      res.json({ rows, total });
    }));

    router.post(`/${resource}`, requirePermission(editPermission), asyncHandler(async (req, res) => {
      const row = await createResource(resource, req.body, req.user);
      await auditAction({ req, action: `create_${resource}`, targetType: resource, targetId: row.id, after: row, reason: req.body?.reason || "created", webhookCategory: resource.startsWith("police") ? "police" : resource.startsWith("ems") ? "ems" : "court" });
      res.status(201).json({ row });
    }));
  });

  return router;
}
