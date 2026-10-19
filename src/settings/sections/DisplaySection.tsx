import type { FxTier } from '../../state/types'
import { SettingRow, Segmented, Switch } from '../controls'

interface DisplaySectionProps {
  fx: FxTier
  reducedMotion: boolean
  onFx: (fx: FxTier) => void
  onReducedMotion: (on: boolean) => void
}

const TIERS = [
  { id: 'full', label: 'Penuh' },
  { id: 'lite', label: 'Hemat' },
] as const

/** How much light and motion the interface spends. */
export function DisplaySection({ fx, reducedMotion, onFx, onReducedMotion }: DisplaySectionProps) {
  return (
    <>
      <SettingRow label="Efek visual" description={fx === 'lite' ? 'Efek lebih ringan: hemat baterai dan cocok untuk perangkat sederhana.' : 'Semua efek: aurora, cahaya tepi, dan latar bergerak.'} wide>
        <Segmented label="Efek visual" value={fx === 'off' ? 'lite' : fx} options={TIERS} onChange={onFx} />
      </SettingRow>
      <SettingRow label="Kurangi gerak" description="Mematikan animasi besar. Pengaturan gerak di sistem Anda selalu dihormati, dengan atau tanpa pilihan ini.">
        <Switch label="Kurangi gerak" checked={reducedMotion} onChange={onReducedMotion} />
      </SettingRow>
    </>
  )
}
