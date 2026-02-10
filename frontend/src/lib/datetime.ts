import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export function formatTimeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: fr,
  })
}
