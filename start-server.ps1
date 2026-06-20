# 不正经修仙模拟器 - 本地服务器启动脚本 (PowerShell备用)
# 当 Node.js 未安装时使用 .NET HttpListener 启动服务器
# 正常情况请用 start-server.bat 或直接 node server.js

$port = 8080
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:$port/"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bu Zheng Jing Xiu Xian - Server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $url" -ForegroundColor Green
Write-Host ""

$hasNode = Get-Command node -ErrorAction SilentlyContinue
if ($hasNode) {
    & node "$dir/server.js" $port
    exit
}

# No Node.js - use .NET HttpListener
Write-Host "Node.js not found, using PowerShell HttpListener..." -ForegroundColor Yellow

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

$job = Start-Job -ScriptBlock {
    param($l, $dir)
    $mimeMap = @{
        '.html'='text/html'; '.js'='text/javascript'; '.css'='text/css'
        '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'
        '.gif'='image/gif'; '.mp3'='audio/mpeg'; '.ico'='image/x-icon'
        '.svg'='image/svg+xml'; '.json'='application/json'
    }
    while ($l.IsListening) {
        $ctx = $l.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $path = $req.Url.AbsolutePath
        if ($path -eq '/favicon.ico') { $res.StatusCode = 204; $res.Close(); continue }
        if ($path -eq '/') { $path = '/index.html' }
        $file = Join-Path $dir $path.Replace('/', '\').TrimStart('\')
        if (Test-Path $file) {
            try {
                $content = [IO.File]::ReadAllBytes($file)
                $ext = [IO.Path]::GetExtension($file).ToLower()
                $res.ContentType = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
                $res.OutputStream.Write($content, 0, $content.Length)
            } catch { $res.StatusCode = 500 }
        } else { $res.StatusCode = 404 }
        $res.Close()
    }
} -ArgumentList $listener, $dir

Start-Sleep 1
Write-Host "Server started. Press Enter to stop." -ForegroundColor Gray
Read-Host
$listener.Stop()
Stop-Job $job -Force 2>$null
Remove-Job $job -Force 2>$null
