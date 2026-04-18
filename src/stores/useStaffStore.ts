import { create } from 'zustand'
import { Staff } from '../types'
import { createSeedStaff, loadStaff, saveStaff } from '../utils/storage'

interface StaffState {
  staff: Staff[]
  initStaff: () => void
  updateStaff: (staffId: string, changes: Partial<Staff>) => void
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  initStaff: () => {
    const savedStaff = loadStaff()
    const staff = savedStaff.length > 0 ? savedStaff : createSeedStaff()
    saveStaff(staff)
    set({ staff })
  },
  updateStaff: (staffId, changes) => {
    const next = get().staff.map((member) => (member.id === staffId ? { ...member, ...changes } : member))
    saveStaff(next)
    set({ staff: next })
  }
}))
