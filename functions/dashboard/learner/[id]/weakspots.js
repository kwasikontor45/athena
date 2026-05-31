function auth(req,env){const s=env.DASHBOARD_SECRET;if(!s)return true;return req.headers.get('Authorization')!==`Bearer ${s}`}
function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestGet({ request, params, env }) {
  if (auth(request, env)) return E('unauthorized', 401)
  const learner = await env.DB.prepare('SELECT id FROM learners WHERE id = ?').bind(params.id).first()
  if (!learner) return E('learner not found', 404)

  const { results } = await env.DB.prepare(
    `SELECT lesson, event, COUNT(*) AS fail_count FROM events WHERE learner_id = ? AND event='step-failed' GROUP BY lesson, event ORDER BY fail_count DESC`
  ).bind(params.id).all()

  return Response.json({ weakspots: results })
}
