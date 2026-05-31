const PHRASE_HASH = '0b7e80cfaccb6214ca7089cd1f4f38f32c2d26c7e0a5038307d14eb055f8a06c'

export async function onRequestPost({ request, env }) {
  try {
    const { phrase_hash } = await request.json()
    if (!phrase_hash || phrase_hash !== PHRASE_HASH) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
    return Response.json({
      url:    'https://athena.kontor.studio/dashboard',
      secret: env.DASHBOARD_SECRET,
    })
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 })
  }
}
