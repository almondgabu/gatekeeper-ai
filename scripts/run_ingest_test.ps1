$body = @{documentId = "4edd0e30-2c14-4f45-8fb0-e538cd006164"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/vault/ingest" -Method POST -ContentType "application/json" -Body $body
Write-Output "DONE"