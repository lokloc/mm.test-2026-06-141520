param([string]$Root = 'C:\ui5', [string]$Owner = 'lokloc')

$ErrorActionPreference = 'Stop'
$results = [System.Collections.Generic.List[object]]::new()

function Get-OptionalProperty($object, [string]$name) {
    if ($null -eq $object) { return $null }
    $property = $object.PSObject.Properties | Where-Object { $_.Name -eq $name } | Select-Object -First 1
    if ($property) { return $property.Value }
    return $null
}

function Get-ProjectMetadata([string]$dir) {
    $package = Get-Content -LiteralPath (Join-Path $dir 'package.json') -Raw | ConvertFrom-Json
    $manifestPath = Join-Path $dir 'webapp\manifest.json'
    $manifest = $null
    if (Test-Path -LiteralPath $manifestPath) {
        try { $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json } catch { $manifest = $null }
    }
    $title = $package.name
    $description = $package.description
    $appId = $null
    $dataSources = @()
    $routes = @()
    if ($manifest) {
        $sapApp = Get-OptionalProperty $manifest 'sap.app'
        if ($sapApp) {
            $appId = $sapApp.id
            if ($sapApp.title -and $sapApp.title -notmatch '^\{\{') { $title = $sapApp.title }
            if ($sapApp.description -and $sapApp.description -notmatch '^\{\{') { $description = $sapApp.description }
            if ($sapApp.dataSources) { $dataSources = @($sapApp.dataSources.PSObject.Properties.Name) }
        }
        $sapUi5 = Get-OptionalProperty $manifest 'sap.ui5'
        if ($sapUi5 -and $sapUi5.routing -and $sapUi5.routing.routes) { $routes = @($sapUi5.routing.routes | ForEach-Object { $_.name }) }
    }
    if (-not $title) { $title = Split-Path $dir -Leaf }
    if (-not $description) { $description = 'SAPUI5 학습 및 기능 구현 프로젝트입니다.' }
    $deps = @()
    if ($package.dependencies) { $deps += $package.dependencies.PSObject.Properties.Name }
    if ($package.devDependencies) { $deps += $package.devDependencies.PSObject.Properties.Name }
    [PSCustomObject]@{ Title=$title; Description=$description; AppId=$appId; DataSources=$dataSources; Routes=$routes; Dependencies=@($deps | Sort-Object -Unique); Scripts=$package.scripts }
}

function Set-GeneratedReadme([string]$dir, $meta) {
    $path = Join-Path $dir 'README.md'
    $old = if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { '' }
    $start = '<!-- codex-summary:start -->'
    $end = '<!-- codex-summary:end -->'
    if ($old -match "(?s)$([regex]::Escape($start)).*?$([regex]::Escape($end))\s*") {
        $old = [regex]::Replace($old, "(?s)$([regex]::Escape($start)).*?$([regex]::Escape($end))\s*", '').TrimStart()
    }
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add($start); $lines.Add("# $($meta.Title)"); $lines.Add(''); $lines.Add($meta.Description); $lines.Add('')
    $lines.Add('## 프로젝트 개요'); $lines.Add(''); $lines.Add("- 유형: SAPUI5 애플리케이션")
    if ($meta.AppId) { $lines.Add("- 애플리케이션 ID: ``$($meta.AppId)``") }
    if ($meta.DataSources.Count) { $lines.Add("- 데이터 소스: $($meta.DataSources -join ', ')") }
    if ($meta.Routes.Count) { $lines.Add("- 주요 라우트: $($meta.Routes -join ', ')") }
    if ($meta.Dependencies.Count) { $lines.Add("- 주요 패키지: $($meta.Dependencies -join ', ')") }
    $lines.Add(''); $lines.Add('## 실행 방법'); $lines.Add(''); $lines.Add('```bash'); $lines.Add('npm install')
    if (Get-OptionalProperty $meta.Scripts 'start') { $lines.Add('npm start') } else { $lines.Add('npx ui5 serve -o index.html') }
    $lines.Add('```'); $lines.Add(''); $lines.Add('## 주요 구조'); $lines.Add(''); $lines.Add('- `webapp/`: 애플리케이션 소스'); $lines.Add('- `webapp/manifest.json`: 앱 설정, 모델, 데이터 소스 및 라우팅'); $lines.Add('- `ui5.yaml`: UI5 Tooling 설정'); $lines.Add('- `package.json`: 실행 스크립트와 의존성'); $lines.Add(''); $lines.Add($end)
    $generated = $lines -join "`r`n"
    $content = if ($old.Trim()) { "$generated`r`n`r`n## 기존 문서`r`n`r`n$old" } else { "$generated`r`n" }
    Set-Content -LiteralPath $path -Value $content -Encoding utf8
}

function Set-GitIgnore([string]$dir) {
    $path = Join-Path $dir '.gitignore'
    $old = if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { '' }
    $rules = @('node_modules/','dist/','coverage/','.ui5/','.env','.env.*','!.env.example','*.pem','*.key','*.p12','*.pfx','credentials.json','service-account*.json','.DS_Store','Thumbs.db','.vscode/','.idea/')
    $missing = $rules | Where-Object { $old -notmatch "(?m)^$([regex]::Escape($_))$" }
    if ($missing.Count) {
        $addition = "# Codex managed ignores`r`n" + ($missing -join "`r`n") + "`r`n"
        Set-Content -LiteralPath $path -Value (($old.TrimEnd() + "`r`n`r`n" + $addition).TrimStart()) -Encoding utf8
    }
}

$projects = Get-ChildItem -LiteralPath $Root -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'package.json') }
if ($env:PROJECT_NAME) { $projects = $projects | Where-Object Name -eq $env:PROJECT_NAME }
foreach ($project in $projects) {
    try {
        $meta = Get-ProjectMetadata $project.FullName
        Set-GeneratedReadme $project.FullName $meta
        Set-GitIgnore $project.FullName
        Push-Location $project.FullName
        try {
            git init -b main | Out-Null
            git config user.name $Owner
            git config user.email "57886758+$Owner@users.noreply.github.com"
            git add --all
            $large = @(git ls-files | ForEach-Object { Get-Item -LiteralPath $_ -ErrorAction SilentlyContinue } | Where-Object Length -GT 95MB)
            if ($large.Count) { throw "95MB 초과 파일: $($large.Name -join ', ')" }
            git diff --cached --quiet
            if ($LASTEXITCODE -ne 0) { git commit -m 'Initial commit: add SAPUI5 project documentation' | Out-Null }
            $repo = "$Owner/$($project.Name)"
            $repoDescription = [string]$meta.Description
            if ([string]::IsNullOrWhiteSpace($repoDescription)) { $repoDescription = 'SAPUI5 project' }
            $repoDescription = ($repoDescription -replace '[\r\n]+', ' ').Trim()
            $existingRemote = @(git remote) -contains 'origin'
            if ($existingRemote) {
                git push origin main | Out-Null
                $results.Add([PSCustomObject]@{Project=$project.Name; Status='uploaded'; Repository="https://github.com/$repo"})
                continue
            }
            gh repo create $repo --private --source . --remote origin --push --description $repoDescription
            if ($LASTEXITCODE -ne 0) { throw 'GitHub 저장소 생성 또는 push 실패' }
            $results.Add([PSCustomObject]@{Project=$project.Name; Status='uploaded'; Repository="https://github.com/$repo"})
        } finally { Pop-Location }
    } catch {
        $results.Add([PSCustomObject]@{Project=$project.Name; Status='failed'; Repository=($_.Exception.Message + ' | ' + $_.ScriptStackTrace)})
    }
}
$results | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'publish-results.json') -Encoding utf8
$results | Format-Table -AutoSize
