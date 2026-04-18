export type NotificationEvent =
  | 'task.status_changed'
  | 'task.deadline_warning'
  | 'task.overdue'
  | 'project.progress'
  | 'project.status_changed'
  | 'payment.received'

export function buildNotificationMessage(
  event: NotificationEvent,
  data: Record<string, any>
): string {
  const templates: Record<NotificationEvent, (d: any) => string> = {
    'task.status_changed': (d) =>
      `📋 [${d.projectName}]\n` +
      `Đầu việc: "${d.taskTitle}"\n` +
      `Trạng thái: ${statusLabel(d.oldStatus)} → ${statusLabel(d.newStatus)}\n` +
      `Cập nhật bởi: ${d.updatedBy}\n` +
      `🕐 ${formatDateTime(d.timestamp)}`,

    'task.deadline_warning': (d) =>
      `⚠️ NHẮC NHỞ [${d.projectName}]\n` +
      `Đầu việc "${d.taskTitle}" còn ${d.daysLeft} ngày đến hạn\n` +
      `Deadline: ${formatDate(d.deadline)}\n` +
      `Trạng thái hiện tại: ${statusLabel(d.status)}`,

    'task.overdue': (d) =>
      `🔴 QUÁ HẠN [${d.projectName}]\n` +
      `Đầu việc "${d.taskTitle}" đã quá hạn ${d.daysOverdue} ngày\n` +
      `Deadline: ${formatDate(d.deadline)}\n` +
      `Vui lòng cập nhật tiến độ hoặc điều chỉnh kế hoạch.`,

    'project.progress': (d) =>
      `📊 TIẾN ĐỘ [${d.projectName}]\n` +
      `Đạt ${d.progress}% — ${d.completedTasks}/${d.totalTasks} đầu việc hoàn thành\n` +
      `Deadline dự án: ${formatDate(d.deadline)}`,

    'project.status_changed': (d) =>
      `🏗️ [${d.projectName}]\n` +
      `Trạng thái dự án: ${projectStatusLabel(d.oldStatus)} → ${projectStatusLabel(d.newStatus)}\n` +
      `Cập nhật bởi: ${d.updatedBy}`,

    'payment.received': (d) =>
      `💰 THANH TOÁN [${d.projectName}]\n` +
      `Đã nhận: ${formatCurrency(d.amount)}\n` +
      `Đợt: ${d.paymentPhase}\n` +
      `Còn lại: ${formatCurrency(d.remaining)}`,
  }

  return templates[event](data)
}

// ─── Helper Functions ────────────────────────────────────────────────

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    todo: 'Chưa bắt đầu',
    in_progress: 'Đang thi công',
    done: 'Hoàn thành',
    adjustment: 'Điều chỉnh',
    pending: 'Tạm dừng',
    cancelled: 'Hủy bỏ',
  }
  return labels[status] ?? status
}

function projectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Đang thi công',
    paused: 'Tạm dừng',
    completed: 'Hoàn thành',
  }
  return labels[status] ?? status
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
