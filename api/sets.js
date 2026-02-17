export default async function handler(req, res) {
  res.status(200).json({
    key_exists: !!process.env.TCG_API_KEY,
    key_preview: process.env.TCG_API_KEY?.slice(0, 8) + '...'
  })
}