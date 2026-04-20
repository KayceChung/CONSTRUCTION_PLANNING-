$payload = @{
    event = "project_status_update"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    source = "ConstructTrack App"
    project = @{
        id = "550e8400-e29b-41d4-a716-446655440000"
        name = "Xây dựng nhà ở Hà Nội"
        location = "Hà Nội"
        client = "Nguyễn Văn A"
        customer_id = "660e8400-e29b-41d4-a716-446655440001"
        category = "new_construction"
        category_note = "Nhà ở 4 tầng"
        address_full = "123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội"
        address_ward = "Phường Láng Thượng"
        address_district = "Quận Đống Đa"
        address_province = "Hà Nội"
        address_google_maps_url = "https://maps.google.com/maps?q=21.0100,105.8050"
        contract_value = 500000000
        paid_amount = 250000000
        payment_note = "Đã thanh toán 50% theo hợp đồng"
        distance_km = 12.5
        start_date = "2026-04-01"
        end_date = "2026-06-30"
        progress = 55
        taskCount = 8
        completedCount = 4
        inProgressCount = 3
        todoCount = 1
        assigned_staff = @("770e8400-e29b-41d4-a716-446655440002", "880e8400-e29b-41d4-a716-446655440003")
        project_type_id = "990e8400-e29b-41d4-a716-446655440004"
        notes = "Dự án ưu tiên, cần hoàn thành đúng hạn"
        zalo_group_thread_id = "group_thread_12345"
        zalo_group_name = "Nhóm Công Trình Hà Nội"
        zalo_linked_at = "2026-04-15T08:00:00Z"
        zalo_status = "active"
        webhook_url = "https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435"
        created_at = "2026-04-01T08:00:00Z"
        updated_at = "2026-04-21T10:30:45Z"
    }
    tasks = @(
        @{
            id = "aaa00000-0000-0000-0000-000000000001"
            project_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Xây dựng nền móng"
            description = "Đào sâu, rót bê tông nền theo thiết kế kiến trúc"
            status = "done"
            images = @("https://storage.supabase.co/images/project-550e/task-001-001.jpg", "https://storage.supabase.co/images/project-550e/task-001-002.jpg", "https://storage.supabase.co/images/project-550e/task-001-003.jpg")
            imageCount = 3
            deadline = "2026-04-10"
            task_deadline = "2026-04-10"
            estimated_days = 10
            start_date = "2026-03-25"
            completed_at = "2026-04-10T16:30:00Z"
            actual_days = 16
            updated_by = "staff_001"
            assignee = "770e8400-e29b-41d4-a716-446655440002"
            note = "Hoàn thành 100%, đã qua kiểm duyệt kỹ thuật"
            sort_order = 1
            from_template_id = $null
            created_at = "2026-03-20T09:00:00Z"
            updated_at = "2026-04-10T16:30:00Z"
        },
        @{
            id = "aaa00000-0000-0000-0000-000000000002"
            project_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Xây tường chính"
            description = "Xây tường chính 4 tầng bằng gạch và vữa cement"
            status = "in_progress"
            images = @("https://storage.supabase.co/images/project-550e/task-002-001.jpg", "https://storage.supabase.co/images/project-550e/task-002-002.jpg")
            imageCount = 2
            deadline = "2026-05-15"
            task_deadline = "2026-05-15"
            estimated_days = 20
            start_date = "2026-04-15"
            completed_at = $null
            actual_days = $null
            updated_by = "staff_002"
            assignee = "880e8400-e29b-41d4-a716-446655440003"
            note = "Đã xây hoàn thành tầng 1, tiến hành tầng 2"
            sort_order = 2
            from_template_id = $null
            created_at = "2026-04-02T10:00:00Z"
            updated_at = "2026-04-21T08:15:00Z"
        },
        @{
            id = "aaa00000-0000-0000-0000-000000000003"
            project_id = "550e8400-e29b-41d4-a716-446655440000"
            title = "Lắp đặt kết cấu mái"
            description = "Lắp đặt dầm thép và kết cấu mái theo bản vẽ"
            status = "todo"
            images = @()
            imageCount = 0
            deadline = "2026-05-30"
            task_deadline = "2026-05-30"
            estimated_days = 15
            start_date = $null
            completed_at = $null
            actual_days = $null
            updated_by = "system"
            assignee = $null
            note = "Chờ hoàn thành xây tường"
            sort_order = 3
            from_template_id = $null
            created_at = "2026-04-05T11:00:00Z"
            updated_at = "2026-04-05T11:00:00Z"
        }
    )
}

$webhookUrl = "https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435"
$payloadJson = $payload | ConvertTo-Json -Depth 10

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SENDING REAL WEBHOOK PAYLOAD                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📤 Target: $webhookUrl" -ForegroundColor Yellow
Write-Host "📦 Payload Size: $($payloadJson.Length) bytes" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "[*] Sending payload..." -ForegroundColor Green
    $response = Invoke-WebRequest -Uri $webhookUrl `
                                 -Method POST `
                                 -ContentType "application/json" `
                                 -Body $payloadJson `
                                 -TimeoutSec 10

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
    Write-Host ""
    Write-Host ("═" * 70) -ForegroundColor Green
    Write-Host "📋 PAYLOAD SUBMITTED:" -ForegroundColor Cyan
    Write-Host ("═" * 70) -ForegroundColor Green
    Write-Host ""
    Write-Host $payloadJson -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Webhook gửi thành công!" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
