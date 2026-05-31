function auth(req,env){const s=env.DASHBOARD_SECRET;if(!s)return true;return req.headers.get('Authorization')!==`Bearer ${s}`}
function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestGet({ request, params, env }) {
  if (auth(request, env)) return E('unauthorized', 401)
  const code = params.code.toUpperCase()
  const { results: learners } = await env.DB.prepare('SELECT id, display_name FROM learners WHERE cohort_code = ?').bind(code).all()
  if (!learners.length) return Response.json({ cohort_code: code, learner_count: 0, completion_pct: 0, learners: [] })

  const ids = learners.map(l => l.id)
  const ph = ids.map(() => '?').join(',')
  const { results: completions } = await env.DB.prepare(
    `SELECT learner_id, COUNT(DISTINCT lesson) AS lessons_done, MAX(timestamp) AS last_seen FROM events WHERE learner_id IN (${ph}) AND event='lesson-complete' GROUP BY learner_id`
  ).bind(...ids).all()

  const cm = {}
  for (const r of completions) cm[r.learner_id] = r
  let totalPct = 0
  const out = learners.map(l => { const c=cm[l.id]||{lessons_done:0,last_seen:null}; totalPct+=c.lessons_done/13; return{id:l.id,display_name:l.display_name,lessons_done:c.lessons_done,last_seen:c.last_seen} })
  return Response.json({ cohort_code: code, learner_count: learners.length, completion_pct: Math.round((totalPct/learners.length)*100), learners: out })
}
