import { appManifest } from '@/lib/app-manifest'
import { BRAND } from '@/lib/constants'

export default function manifest() {
  return appManifest(BRAND.product, '/dashboard')
}
