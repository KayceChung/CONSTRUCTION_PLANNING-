import { create } from 'zustand'
import { InteractionLog, Customer } from '../types'
import { createCustomerRecord, deleteCustomerRecord, loadInteractionLogs, loadCustomers, saveInteractionLogs, saveCustomers } from '../utils/storage'

interface CustomerState {
  customers: Customer[]
  interactionLogs: InteractionLog[]
  initCustomers: () => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (customerId: string, changes: Partial<Customer>) => void
  deleteCustomer: (customerId: string) => void
  addInteractionLog: (log: InteractionLog) => void
  updateCustomerStatus: (customerId: string, status: Customer['status']) => void
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  interactionLogs: [],
  initCustomers: async () => {
    try {
      const [customers, interactionLogs] = await Promise.all([loadCustomers(), loadInteractionLogs()])
      set({ customers, interactionLogs })
    } catch (error) {
      console.error('Error initializing customers:', error)
    }
  },
  addCustomer: async (customer) => {
    const createdCustomer = await createCustomerRecord(customer)
    const next = [...get().customers, createdCustomer]
    set({ customers: next })
  },
  updateCustomer: async (customerId, changes) => {
    const next = get().customers.map((customer) =>
      customer.id === customerId ? { ...customer, ...changes, updatedAt: new Date().toISOString() } : customer
    )
    await saveCustomers(next)
    set({ customers: next })
  },
  deleteCustomer: async (customerId) => {
    await deleteCustomerRecord(customerId)
    const next = get().customers.filter((customer) => customer.id !== customerId)
    set({ customers: next })
  },
  addInteractionLog: async (log) => {
    const nextLogs = [...get().interactionLogs, log]
    await saveInteractionLogs(nextLogs)
    set({ interactionLogs: nextLogs })
  },
  updateCustomerStatus: async (customerId, status) => {
    const next = get().customers.map((customer) =>
      customer.id === customerId ? { ...customer, status, updatedAt: new Date().toISOString() } : customer
    )
    await saveCustomers(next)
    set({ customers: next })
  }
}))
