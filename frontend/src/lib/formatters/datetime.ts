export function formatTimeAgo(dateLike: string | number | Date) {
  const d = new Date(dateLike)
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diffSec < 45) return "à l'instant"
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`
  const days = Math.floor(diffSec / 86400)
  if (days < 30) return `il y a ${days} j`
  return d.toLocaleDateString()
}
