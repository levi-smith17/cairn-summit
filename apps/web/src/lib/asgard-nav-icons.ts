import {
  Globe,
  HardDrive,
  MonitorPlay,
  Network,
  Server,
  Settings,
  Shield,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type AsgardNavIcon = ComponentType<{ className?: string }>

/** Maps Asgard embed nav icon ids to Lucide components for Cairn sidebar links. */
export const asgardNavIconById: Record<string, AsgardNavIcon> = {
  globe: Globe,
  network: Network,
  shield: Shield,
  'hard-drive': HardDrive,
  'monitor-play': MonitorPlay,
  server: Server,
  settings: Settings,
}

export function asgardNavIcon(iconId: string): AsgardNavIcon {
  return asgardNavIconById[iconId] ?? Globe
}
