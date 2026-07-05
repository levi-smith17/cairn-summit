import {
  Globe,
  HardDrive,
  Home,
  LayoutDashboard,
  MonitorPlay,
  Network,
  Server,
  Settings,
  Shield,
  Workflow,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { PiholeRaspberryIcon } from '@/components/brand/pihole-raspberry-icon'

export type AsgardNavIcon = ComponentType<{ className?: string }>

/** Maps Asgard embed nav icon ids to components — keep in sync with Asgard asgard-nav-icons.ts. */
export const asgardNavIconById: Record<string, AsgardNavIcon> = {
  dashboard: LayoutDashboard,
  globe: Globe,
  workflow: Workflow,
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
