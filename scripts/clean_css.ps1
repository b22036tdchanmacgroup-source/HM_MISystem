# App.css에서 5680라인 이후의 모든 !important를 제거
$lines = Get-Content "App.css"
$sectionStart = 5680  # 0-indexed: 5679

$result = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -ge ($sectionStart - 1)) {
        # !important 제거 (단, 공백+!important 패턴)
        $result += $lines[$i] -replace '\s*!important', ''
    } else {
        $result += $lines[$i]
    }
}

Set-Content "App.css" -Value $result -Encoding UTF8
Write-Host ("Done. Total lines: " + $result.Count)
