function auth(req,env){const s=env.DASHBOARD_SECRET;if(!s)return true;return req.headers.get('Authorization')!==`Bearer ${s}`}
function E(m,s=400){return Response.json({error:m},{status:s})}

export async function onRequestGet({ request, params, env }) {
  if (auth(request, env)) return E('unauthorized', 401)
  const code = params.code.toUpperCase()
  const { results: learners } = await env.DB.prepare('SELECT id FROM learners WHERE cohort_code = ?').bind(code).all()
  if (!learners.length) return Response.json({ rows: [] })

  const ids = learners.map(l => l.id)
  const ph = ids.map(() => '?').join(',')
  const { results: rows } = await env.DB.prepare(
    `SELECT lesson, event, COUNT(DISTINCT learner_id) AS learner_count FROM events WHERE learner_id IN (${ph}) AND lesson IS NOT NULL GROUP BY lesson, event`
  ).bind(...ids).all()

  const lessons = {}
  for (const r of rows) {
    if (!lessons[r.lesson]) lessons[r.lesson] = { completed: 0, struggled: 0 }
    if (r.event === 'lesson-complete') lessons[r.lesson].completed = r.learner_count
    if (r.event === 'step-failed') lessons[r.lesson].struggled = Math.max(lessons[r.lesson].struggled, r.learner_count)
  }

  const { results: touched } = await env.DB.prepare(
    `SELECT lesson, COUNT(DISTINCT learner_id) AS learner_count FROM events WHERE learner_id IN (${ph}) AND lesson IS NOT NULL GROUP BY lesson`
  ).bind(...ids).all()

  const tm = {}
  for (const t of touched) tm[t.lesson] = t.learner_count
  const out = Object.entries(lessons).map(([lesson, s]) => ({ lesson, total_learners: ids.length, completed: s.completed, struggled: Math.max(0,s.struggled-s.completed), abandoned: Math.max(0,(tm[lesson]||0)-s.completed) }))
  return Response.json({ rows: out })
}
