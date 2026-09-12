"use strict";

function createAdminRoutes({ app, getUserBySession, getSessionToken, pool }) {
  async function requireAdmin(req, res) {
    const user = await getUserBySession(getSessionToken(req));
    if (!user) { res.status(401).json({ ok:false, error:"É necessário iniciar sessão." }); return null; }
    if (user.role !== "admin") { res.status(403).json({ ok:false, error:"Acesso administrativo não autorizado." }); return null; }
    return user;
  }

  app.get("/api/admin/overview", async (req,res) => {
    try {
      const admin = await requireAdmin(req,res); if (!admin) return;
      if (!pool) return res.status(503).json({ok:false,error:"O painel administrativo requer PostgreSQL ativo."});
      const result = await pool.query(`
        WITH account_metrics AS (
          SELECT
            a.user_id,
            a.updated_at,
            a.study,
            a.work,
            a.organize,
            a.library,
            COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.organize->'tasks') = 'array' THEN a.organize->'tasks' ELSE '[]'::jsonb END), 0) AS tasks,
            COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.organize->'goals') = 'array' THEN a.organize->'goals' ELSE '[]'::jsonb END), 0) AS goals,
            COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.organize->'notes') = 'array' THEN a.organize->'notes' ELSE '[]'::jsonb END), 0) AS notes,
            COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.organize->'events') = 'array' THEN a.organize->'events' ELSE '[]'::jsonb END), 0) AS events,
            COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(a.library->'items') = 'array' THEN a.library->'items' ELSE '[]'::jsonb END), 0) AS library_items
          FROM account_data a
        ),
        task_metrics AS (
          SELECT COALESCE(SUM(CASE WHEN t.item->>'completed' = 'true' THEN 1 ELSE 0 END),0)::int AS completed
          FROM account_metrics a
          LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(a.organize->'tasks') = 'array' THEN a.organize->'tasks' ELSE '[]'::jsonb END) t(item) ON TRUE
        )
        SELECT
          (SELECT COUNT(*)::int FROM users) AS users,
          (SELECT COUNT(*)::int FROM sessions WHERE expires_at > NOW()) AS active_sessions,
          (SELECT COUNT(*)::int FROM account_data) AS accounts_with_data,
          (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS admins,
          COUNT(*) FILTER (WHERE study IS NOT NULL)::int AS study_accounts,
          COUNT(*) FILTER (WHERE study->>'practiceCompleted' = 'true')::int AS study_practiced,
          COUNT(*) FILTER (WHERE study->>'quizCompleted' = 'true')::int AS study_measured,
          COUNT(*) FILTER (WHERE work IS NOT NULL AND COALESCE(work->>'title','') <> '')::int AS work_accounts,
          COUNT(*) FILTER (WHERE work->>'researchReady' = 'true')::int AS work_researched,
          COUNT(*) FILTER (WHERE work->>'reviewed' = 'true')::int AS work_reviewed,
          COUNT(*) FILTER (WHERE work->>'finalized' = 'true')::int AS work_finalized,
          COALESCE(SUM(tasks),0)::int AS tasks,
          COALESCE(SUM(goals),0)::int AS goals,
          COALESCE(SUM(notes),0)::int AS notes,
          COALESCE(SUM(events),0)::int AS events,
          COALESCE(SUM(library_items),0)::int AS library_items,
          (SELECT completed FROM task_metrics) AS completed_tasks,
          MAX(updated_at) AS last_data_update
        FROM account_metrics
      `);
      const r = result.rows[0];
      return res.json({ok:true, overview:{
        users:r.users, activeSessions:r.active_sessions, accountsWithData:r.accounts_with_data, admins:r.admins,
        study:{accounts:r.study_accounts, practiced:r.study_practiced, measured:r.study_measured},
        work:{accounts:r.work_accounts, researched:r.work_researched, reviewed:r.work_reviewed, finalized:r.work_finalized},
        organize:{tasks:r.tasks, completedTasks:r.completed_tasks, goals:r.goals, notes:r.notes, events:r.events},
        library:{items:r.library_items},
        lastDataUpdate:r.last_data_update
      }});
    } catch (_) { return res.status(500).json({ok:false,error:"Não foi possível carregar o painel."}); }
  });

  app.get("/api/admin/monetization", async (req,res) => {
    try {
      const admin = await requireAdmin(req,res); if (!admin) return;
      const provider = String(process.env.NHIMY_AD_PROVIDER || "").trim();
      const publisherId = String(process.env.NHIMY_AD_PUBLISHER_ID || "").trim();
      const enabled = process.env.NHIMY_ADS_ENABLED === "1" && Boolean(provider && publisherId);
      return res.json({ok:true, monetization:{
        status: enabled ? "active" : "prepared",
        enabled,
        provider: provider || null,
        publisherConfigured: Boolean(publisherId),
        consentRequired: true,
        metrics: {available:false, reason:"Ainda sem integração de métricas do fornecedor."}
      }});
    } catch (_) { return res.status(500).json({ok:false,error:"Não foi possível carregar a configuração de monetização."}); }
  });

  app.get("/api/admin/users", async (req,res) => {
    try {
      const admin = await requireAdmin(req,res); if (!admin) return;
      if (!pool) return res.status(503).json({ok:false,error:"O painel administrativo requer PostgreSQL ativo."});
      const result = await pool.query("SELECT id,email,name,role,created_at FROM users ORDER BY created_at DESC LIMIT 100");
      return res.json({ok:true,users:result.rows.map(u=>({id:u.id,email:u.email,name:u.name,role:u.role,createdAt:u.created_at}))});
    } catch (_) { return res.status(500).json({ok:false,error:"Não foi possível carregar os utilizadores."}); }
  });
}

export { createAdminRoutes };
