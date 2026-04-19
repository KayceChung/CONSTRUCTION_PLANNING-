
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  is_active: boolean
}

export default function StaffApproval() {
  const [pendingStaff, setPendingStaff] = useState<Staff[]>([])

  useEffect(() => {
    supabase.from('staff').select('*').eq('is_active', false).then(({ data }) => setPendingStaff(data ?? []))
  }, [])

  const approve = async (id: string) => {
    await supabase.from('staff').update({ is_active: true }).eq('id', id)
    setPendingStaff(pendingStaff.filter(s => s.id !== id))
  }

  return (
    <div>
      <h2>Nhân sự chờ duyệt</h2>
      <ul>
        {pendingStaff.map(staff => (
          <li key={staff.id}>
            {staff.name} ({staff.email}) <button onClick={() => approve(staff.id)}>Duyệt</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
