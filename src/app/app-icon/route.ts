import { appIcon } from '@/lib/app-icon'
import { BRAND } from '@/lib/constants'

export function GET(request: Request) {
  return appIcon(BRAND.product, null, new URL(request.url).searchParams.get('size'))
}
