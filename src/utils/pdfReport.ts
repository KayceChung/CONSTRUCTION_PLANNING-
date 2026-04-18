import autoTable from 'jspdf-autotable'
import { jsPDF } from 'jspdf'
import { Project } from '../types'
import { formatDate } from './progress'

export function exportProjectPdf(project: Project, options?: { customerName?: string; customerPhone?: string }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const title = `Báo cáo tiến độ dự án: ${project.name}`
  doc.setFontSize(16)
  doc.text(title, 40, 50)

  doc.setFontSize(11)
  doc.text(`Khách hàng: ${options?.customerName || project.client}`, 40, 80)
  if (options?.customerPhone) {
    doc.text(`SĐT: ${options.customerPhone}`, 40, 98)
  }
  doc.text(`Địa chỉ thi công: ${project.address?.fullAddress || project.location}`, 40, 116)
  doc.text(`Loại hình: ${project.category === 'new_construction' ? 'Xây mới' : project.category === 'renovation' ? 'Cải tạo' : 'Khác'}`, 40, 134)
  doc.text(`Giá trị HĐ: ${new Intl.NumberFormat('vi-VN').format(project.contractValue)} đ`, 40, 152)
  doc.text(`Đã thanh toán: ${new Intl.NumberFormat('vi-VN').format(project.paidAmount)} đ`, 40, 170)
  doc.text(`Còn lại: ${new Intl.NumberFormat('vi-VN').format(Math.max(0, project.contractValue - project.paidAmount))} đ`, 40, 188)

  const activeTasks = project.tasks.filter((task) => task.status !== 'cancelled')
  const totalPlanDays = activeTasks.reduce((sum, task) => sum + (task.estimatedDays || 0), 0)
  const onTimeCount = activeTasks.filter((task) => task.status === 'done' && task.actualDays != null && task.estimatedDays != null && task.actualDays <= task.estimatedDays).length
  const overdueCount = activeTasks.filter((task) => task.status === 'done' && task.actualDays != null && task.estimatedDays != null && task.actualDays > task.estimatedDays).length
  const lateTasks = activeTasks.filter((task) => task.status === 'done' && task.actualDays != null && task.estimatedDays != null && task.actualDays > task.estimatedDays)
  const maxLate = lateTasks.reduce((best, task) => {
    if (!best || (task.actualDays || 0) - (task.estimatedDays || 0) > (best.actualDays || 0) - (best.estimatedDays || 0)) {
      return task
    }
    return best
  }, null as (typeof lateTasks[number] | null))

  doc.setFontSize(11)
  doc.text(`Tổng số ngày kế hoạch toàn dự án: ${totalPlanDays}`, 40, 80)
  doc.text(`Hoàn thành đúng hạn: ${onTimeCount}`, 40, 98)
  doc.text(`Hoàn thành trễ hạn: ${overdueCount}`, 40, 116)
  if (maxLate) {
    const lateBy = (maxLate.actualDays || 0) - (maxLate.estimatedDays || 0)
    doc.text(`Hạng mục trễ nhất: ${maxLate.title} (${lateBy} ngày)`, 40, 134)
  }

  const rows = activeTasks.map((task, index) => [
    index + 1,
    task.title,
    task.deadline ? formatDate(task.deadline) : '-',
    task.estimatedDays != null ? String(task.estimatedDays) : '-',
    task.actualDays != null ? String(task.actualDays) : '-',
    task.status.replace('_', ' '),
    task.note || ''
  ])

  autoTable(doc, {
    startY: maxLate ? 160 : 148,
    head: [['STT', 'Hạng mục', 'Deadline', 'Số ngày KH', 'Số ngày TT', 'Trạng thái', 'Ghi chú']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 140 },
      2: { cellWidth: 70 },
      3: { cellWidth: 60 },
      4: { cellWidth: 60 },
      5: { cellWidth: 80 },
      6: { cellWidth: 120 }
    }
  })

  doc.save(`${project.id}-report.pdf`)
}
