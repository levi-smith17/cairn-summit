import {
  Globe,
  HardDrive,
  Home,
  MonitorPlay,
  Network,
  Server,
  Settings,
  Shield,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { PiholeRaspberryIcon } from '@/components/brand/pihole-raspberry-icon'

export type AsgardNavIcon = ComponentType<{ className?: string }>

/** Maps Asgard embed nav icon ids to Lucide components for Cairn sidebar links. */
export const asgardNavIconById: Record<string, AsgardNavIcon> = {
  globe: Globe,
  network: Network,
  shield: Shield,
  'hard-drive': HardDrive,
  'monitor-play': MonitorPlay,
  home: Home,
  server: Server,
  settings: Settings,
  pihole: PiholeRaspberryIcon,
}

export function asgardNavIcon(iconId: string): AsgardNavIcon {
  return asgardNavIconById[iconId] ?? Globe
}
