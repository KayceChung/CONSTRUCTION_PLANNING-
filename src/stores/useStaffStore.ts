import { create } from 'zustand'
import { Staff } from '../types'
import { deleteStaffRecord, loadStaff, updateStaffRecord } from '../utils/storage'

interface StaffState {
  staff: Staff[]
  initStaff: () => Promise<void>
  updateStaff: (staffId: string, changes: Partial<Staff>) => Promise<void>
  deleteStaff: (staffId: string) => Promise<void>
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  initStaff: async () => {
    try {
      const staff = await loadStaff()
      set({ staff })
    } catch (error) {
      console.error('Error initializing staff:', error)
    }
  },
  updateStaff: async (staffId, changes) => {
    await updateStaffRecord(staffId, changes)
    const next = get().staff.map((member) => (member.id === staffId ? { ...member, ...changes } : member))
    set({ staff: next })
  },
  deleteStaff: async (staffId) => {
    await deleteStaffRecord(staffId)
    const next = get().staff.filter((member) => member.id !== staffId)
    set({ staff: next })
  }
}))
