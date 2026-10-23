$sourceDir = "c:\xampp\htdocs\HomeFix-NextJS-Mejorado"
$destinationZip = "c:\xampp\htdocs\HomeFix-NextJS-Mejorado-Completo.zip"

Write-Host "Comprimiendo proyecto HomeFix..."

if (Test-Path $destinationZip) {
    Remove-Item $destinationZip -Force
}

$items = Get-ChildItem -Path $sourceDir | Where-Object { 
    $_.Name -ne "node_modules" -and $_.Name -ne ".next" -and $_.Name -ne ".git"
}

Compress-Archive -Path $items.FullName -DestinationPath $destinationZip -CompressionLevel Optimal

if (Test-Path $destinationZip) {
    $zipSize = (Get-Item $destinationZip).Length / 1MB
    Write-Host ("✅ Archivo ZIP generado exitosamente: {0} ({1:N2} MB)" -f $destinationZip, $zipSize)
} else {
    Write-Error "No se pudo generar el archivo ZIP."
}
