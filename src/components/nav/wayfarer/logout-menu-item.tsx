import { logout } from '@/actions/auth'

import {
    LogOut
} from "lucide-react"
import { DropdownMenuItem } from '../../ui/dropdown-menu'

export function LogoutMenuItem() {
  return (
    <DropdownMenuItem onClick={() => logout()}>
      <LogOut className="h-4 w-4" />
      Log out
    </DropdownMenuItem>
  )
}