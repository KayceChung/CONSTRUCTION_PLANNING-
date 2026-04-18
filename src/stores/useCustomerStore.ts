import { create } from 'zustand'
import { ContactLog, Customer } from '../types'
import { createSeedContactLogs, createSeedCustomers, loadContactLogs, loadCustomers, saveContactLogs, saveCustomers } from '../utils/storage'

interface CustomerState {
  customers: Customer[]
  contactLogs: ContactLog[]
  initCustomers: () => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (customerId: string, changes: Partial<Customer>) => void
  deleteCustomer: (customerId: string) => void
  addContactLog: (log: ContactLog) => void
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  contactLogs: [],
  initCustomers: () => {
    const savedCustomers = loadCustomers()
    const savedContactLogs = loadContactLogs()
    const customers = savedCustomers.length > 0 ? savedCustomers : createSeedCustomers()
    const contactLogs = savedContactLogs.length > 0 ? savedContactLogs : createSeedContactLogs()
    saveCustomers(customers)
    saveContactLogs(contactLogs)
    set({ customers, contactLogs })
  },
  addCustomer: (customer) => {
    const next = [...get().customers, customer]
    saveCustomers(next)
    set({ customers: next })
  },
  updateCustomer: (customerId, changes) => {
    const next = get().customers.map((customer) =>
      customer.id === customerId ? { ...customer, ...changes } : customer
    )
    saveCustomers(next)
    set({ customers: next })
  },
  deleteCustomer: (customerId) => {
    const next = get().customers.filter((customer) => customer.id !== customerId)
    saveCustomers(next)
    set({ customers: next })
  },
  addContactLog: (log) => {
    const nextLogs = [...get().contactLogs, log]
    saveContactLogs(nextLogs)
    set({ contactLogs: nextLogs })
  }
}))
