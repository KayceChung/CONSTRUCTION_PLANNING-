#!/usr/bin/env pwsh
# Test Webhook Script

$webhookUrl = 'https://yi7a1c8g.rpcld.co/webhook-test/00b8a546-422b-4786-ad00-0105bb20c435'

$payload = @{
    event = 'status_changed'
    timestamp = [System.DateTime]::UtcNow.ToString('o')
    isTestPayload = $true
    message = 'Test webhook payload from ConstructTrack'
    project = @{
        id = 'project-test-001'
        name = 'Test Project'
        location = 'Ha Noi'
        client = 'Test Client'
        category = 'new_construction'
        contractValue = 500000000
        paidAmount = 250000000
        startDate = '2026-04-01'
        endDate = '2026-06-30'
        progress = 45
        taskCount = 12
        completedCount = 5
    }
    task = @{
        id = 'task-test-001'
        title = 'Test Task - Webhook Verification'
        description = 'This is a sample task sent via webhook'
        previousStatus = 'todo'
        newStatus = 'in_progress'
        note = 'Webhook test - Connection verification'
        updatedBy = 'System Test'
        updatedAt = [System.DateTime]::UtcNow.ToString('o')
        deadline = '2026-05-01'
        estimatedDays = 10
        startDate = '2026-04-21'
        actualDays = $null
        isOverdue = $false
        daysRemaining = 10
        assignee = $null
        images = 0
    }
}

$jsonBody = $payload | ConvertTo-Json -Depth 10

Write-Host "[*] Sending webhook to: $webhookUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Payload:" -ForegroundColor Cyan
Write-Host $jsonBody
Write-Host ""
Write-Host "[*] Sending..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $webhookUrl `
        -Method POST `
        -Headers @{'Content-Type' = 'application/json'} `
        -Body $jsonBody `
        -TimeoutSec 10

    Write-Host "[OK] Success!" -ForegroundColor Green
    Write-Host "[OK] Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] Response Body:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Green
    exit 0
} catch {
    Write-Host "[ERROR] Failed to send webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "[ERROR] Status Code: $statusCode" -ForegroundColor Red
        
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        
        if ($body) {
            Write-Host "[ERROR] Response Body: $body" -ForegroundColor Red
        }
    }
    exit 1
}
