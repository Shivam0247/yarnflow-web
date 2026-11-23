<#
  YarnFlow - export the old "Creative" software database (READ-ONLY)
  ------------------------------------------------------------------
  Run this on the office PC that can reach the SQL Server
  (the old software's setting: ServerName = 192.168.0.254,1444).

  It only runs SELECT queries. It never changes, deletes or writes anything in
  SQL Server. It writes files only into the output folder you choose.

  What it exports, for every database you pick (e.g. UMIYA24, UMIYA20):
    schema.json        every table/view: columns, data types, keys, relations, row counts
    modules.sql        source of all views / stored procedures / functions (report logic)
    data\<table>.csv   every row of every table (UTF-8, comma separated, quoted)
    summary.txt        table list with row counts

  How to run (Windows):
    1. Copy this file to the office PC.
    2. Right-click it -> "Run with PowerShell".
       (If Windows blocks it, open PowerShell and run:
        powershell -ExecutionPolicy Bypass -File .\Export-OldDatabase.ps1)
    3. Answer the questions. When it finishes, copy the output folder to the SanDisk.
#>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Data
$fast = $true
try {
Add-Type -ReferencedAssemblies System.Data -TypeDefinition @'
using System; using System.IO; using System.Text; using System.Data; using System.Data.SqlClient; using System.Globalization;
public static class YfExport {
  static string Cell(object v) {
    if (v == null || v is DBNull) return "";
    string s;
    if (v is byte[]) s = "base64:" + Convert.ToBase64String((byte[])v);
    else if (v is DateTime) s = ((DateTime)v).ToString("yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture);
    else if (v is DateTimeOffset) s = ((DateTimeOffset)v).ToString("yyyy-MM-dd HH:mm:ss.fffzzz", CultureInfo.InvariantCulture);
    else if (v is bool) s = ((bool)v) ? "1" : "0";
    else if (v is IFormattable) s = ((IFormattable)v).ToString(null, CultureInfo.InvariantCulture);
    else s = v.ToString();
    return "\"" + s.Replace("\"", "\"\"") + "\"";
  }
  public static long Table(SqlConnection c, string sql, string file) {
    using (var cmd = c.CreateCommand()) {
      cmd.CommandText = sql; cmd.CommandTimeout = 0;
      using (var rd = cmd.ExecuteReader())
      using (var w = new StreamWriter(file, false, new UTF8Encoding(false), 1 << 20)) {
        var sb = new StringBuilder();
        for (int k = 0; k < rd.FieldCount; k++) { if (k > 0) sb.Append(','); sb.Append("\"" + rd.GetName(k).Replace("\"", "\"\"") + "\""); }
        w.WriteLine(sb.ToString());
        var vals = new object[rd.FieldCount]; long n = 0;
        while (rd.Read()) {
          rd.GetValues(vals); sb.Clear();
          for (int k = 0; k < vals.Length; k++) { if (k > 0) sb.Append(','); sb.Append(Cell(vals[k])); }
          w.WriteLine(sb.ToString()); n++;
        }
        return n;
      }
    }
  }
}
'@
} catch { $fast = $false; Write-Host 'Fast mode not available on this PC - using normal mode (slower, same result).' -ForegroundColor Yellow }

function Ask($q, $def) { $a = Read-Host "$q [$def]"; if ([string]::IsNullOrWhiteSpace($a)) { $def } else { $a.Trim() } }

Write-Host ""
Write-Host "YarnFlow - old database export (read-only)" -ForegroundColor Cyan
Write-Host ""
$server = Ask "SQL Server address" "192.168.0.254,1444"
$auth   = Ask "Login type: W = Windows login, S = SQL login (sa etc.)" "W"
if ($auth -match '^[sS]') {
  $user = Ask "SQL user name" "sa"
  $sec  = Read-Host "SQL password" -AsSecureString
  $pass  = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
  $base = "Server=$server;User ID=$user;Password=$pass;Connect Timeout=30;Application Name=YarnFlowExport;ApplicationIntent=ReadOnly"
} else {
  $base = "Server=$server;Integrated Security=True;Connect Timeout=30;Application Name=YarnFlowExport;ApplicationIntent=ReadOnly"
}

function Open-Db($db) { $c = New-Object System.Data.SqlClient.SqlConnection("$base;Database=$db"); $c.Open(); $c }
function Query($conn, $sql) {
  $cmd = $conn.CreateCommand(); $cmd.CommandText = $sql; $cmd.CommandTimeout = 0
  $da = New-Object System.Data.SqlClient.SqlDataAdapter($cmd); $t = New-Object System.Data.DataTable; [void]$da.Fill($t); ,$t
}

# list databases
$m = Open-Db "master"
$dbs = Query $m "SELECT name, CONVERT(varchar(30), create_date, 120) AS created FROM sys.databases WHERE database_id > 4 AND state = 0 ORDER BY name"
$m.Close()
Write-Host ""
Write-Host "Databases on this server:" -ForegroundColor Cyan
$i = 0; foreach ($r in $dbs.Rows) { $i++; Write-Host ("  {0,2}. {1}   (created {2})" -f $i, $r.name, $r.created) }
$defaultPick = ($dbs.Rows | Where-Object { $_.name -like 'UMIYA*' } | ForEach-Object { $_.name }) -join ','
if (-not $defaultPick) { $defaultPick = ($dbs.Rows | ForEach-Object { $_.name }) -join ',' }
$pick = Ask "Databases to export (comma separated names, or ALL)" $defaultPick
if ($pick -eq 'ALL') { $pick = ($dbs.Rows | ForEach-Object { $_.name }) -join ',' }
$targets = $pick.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }

$outRoot = Ask "Output folder" (Join-Path ([Environment]::GetFolderPath('Desktop')) ("YarnFlowExport_" + (Get-Date -Format 'yyyyMMdd_HHmm')))
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)
function CsvCell($v) {
  if ($v -is [System.DBNull] -or $null -eq $v) { return '' }
  if ($v -is [byte[]]) { $s = 'base64:' + [Convert]::ToBase64String($v) }
  elseif ($v -is [datetime]) { $s = $v.ToString('yyyy-MM-dd HH:mm:ss.fff') }
  elseif ($v -is [datetimeoffset]) { $s = $v.ToString('yyyy-MM-dd HH:mm:ss.fffzzz') }
  elseif ($v -is [bool]) { $s = if ($v) { '1' } else { '0' } }
  elseif ($v -is [decimal] -or $v -is [double] -or $v -is [single]) { $s = $v.ToString([Globalization.CultureInfo]::InvariantCulture) }
  else { $s = [string]$v }
  '"' + $s.Replace('"', '""') + '"'
}

foreach ($db in $targets) {
  Write-Host ""
  Write-Host "=== $db ===" -ForegroundColor Cyan
  $dir = Join-Path $outRoot $db; $dataDir = Join-Path $dir 'data'
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  $c = Open-Db $db

  Write-Host "  Reading table list and design..."
  $tables = Query $c @"
SELECT s.name AS sch, o.name AS name, o.type_desc AS kind,
       (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = o.object_id AND p.index_id IN (0,1)) AS row_count
FROM sys.objects o JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.type IN ('U','V') AND o.is_ms_shipped = 0 ORDER BY o.type, o.name
"@
  $cols = Query $c @"
SELECT s.name AS sch, o.name AS tbl, c.column_id, c.name AS col, t.name AS type, c.max_length, c.precision, c.scale,
       c.is_nullable, c.is_identity, c.is_computed, dc.definition AS default_def, cc.definition AS computed_def
FROM sys.columns c JOIN sys.objects o ON o.object_id = c.object_id JOIN sys.schemas s ON s.schema_id = o.schema_id
JOIN sys.types t ON t.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
WHERE o.type IN ('U','V') AND o.is_ms_shipped = 0 ORDER BY o.name, c.column_id
"@
  $keys = Query $c @"
SELECT s.name AS sch, o.name AS tbl, i.name AS idx, i.is_primary_key, i.is_unique, ic.key_ordinal, col.name AS col
FROM sys.indexes i JOIN sys.objects o ON o.object_id = i.object_id JOIN sys.schemas s ON s.schema_id = o.schema_id
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
WHERE o.type = 'U' AND o.is_ms_shipped = 0 AND (i.is_primary_key = 1 OR i.is_unique = 1) ORDER BY o.name, i.name, ic.key_ordinal
"@
  $fks = Query $c @"
SELECT fk.name AS fk, OBJECT_NAME(fk.parent_object_id) AS tbl, pc.name AS col,
       OBJECT_NAME(fk.referenced_object_id) AS ref_tbl, rc.name AS ref_col
FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
"@
  $mods = Query $c @"
SELECT s.name AS sch, o.name, o.type_desc AS kind, m.definition
FROM sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.is_ms_shipped = 0 ORDER BY o.type, o.name
"@

  # schema.json  (lookups by table name, so this is quick even with 600+ tables)
  Write-Host "  Writing table design (schema.json)..."
  $colMap = @{}; foreach ($r in $cols.Rows) { $k = $r.sch + '.' + $r.tbl; if (-not $colMap.ContainsKey($k)) { $colMap[$k] = New-Object System.Collections.ArrayList }; [void]$colMap[$k].Add($r) }
  $keyMap = @{}; foreach ($r in $keys.Rows) { $k = $r.sch + '.' + $r.tbl; if (-not $keyMap.ContainsKey($k)) { $keyMap[$k] = New-Object System.Collections.ArrayList }; [void]$keyMap[$k].Add($r) }
  $fkMap  = @{}; foreach ($r in $fks.Rows)  { $k = [string]$r.tbl; if (-not $fkMap.ContainsKey($k)) { $fkMap[$k] = New-Object System.Collections.ArrayList }; [void]$fkMap[$k].Add($r) }
  $tlist = New-Object System.Collections.ArrayList
  foreach ($t in $tables.Rows) {
    $k = $t.sch + '.' + $t.name
    $tc = if ($colMap.ContainsKey($k)) { $colMap[$k] } else { @() }
    $tk = if ($keyMap.ContainsKey($k)) { $keyMap[$k] } else { @() }
    $tf = if ($fkMap.ContainsKey([string]$t.name)) { $fkMap[[string]$t.name] } else { @() }
    [void]$tlist.Add([ordered]@{
      schema = $t.sch; name = $t.name; kind = $t.kind; rows = if ($t.row_count -is [DBNull]) { $null } else { [long]$t.row_count }
      columns = @($tc | ForEach-Object { [ordered]@{ name = $_.col; type = $_.type; maxLength = $_.max_length; precision = $_.precision; scale = $_.scale; nullable = [bool]$_.is_nullable; identity = [bool]$_.is_identity; computed = if ($_.computed_def -is [DBNull]) { $null } else { $_.computed_def }; default = if ($_.default_def -is [DBNull]) { $null } else { $_.default_def } } })
      keys = @($tk | ForEach-Object { [ordered]@{ index = $_.idx; primary = [bool]$_.is_primary_key; unique = [bool]$_.is_unique; column = $_.col } })
      foreignKeys = @($tf | ForEach-Object { [ordered]@{ column = $_.col; refTable = $_.ref_tbl; refColumn = $_.ref_col } })
    })
  }
  $schema = [ordered]@{ database = $db; server = $server; exportedAt = (Get-Date -Format 's'); tables = $tlist }
  [IO.File]::WriteAllText((Join-Path $dir 'schema.json'), ($schema | ConvertTo-Json -Depth 8 -Compress), $utf8)

  # modules.sql (views, procedures, functions = report logic)
  Write-Host "  Writing report queries (modules.sql)..."
  $sb = New-Object System.Text.StringBuilder
  foreach ($r in $mods.Rows) { [void]$sb.AppendLine("-- ===== $($r.kind): [$($r.sch)].[$($r.name)]"); [void]$sb.AppendLine($r.definition); [void]$sb.AppendLine("GO") }
  [IO.File]::WriteAllText((Join-Path $dir 'modules.sql'), $sb.ToString(), $utf8)

  # data: every row of every table
  $summary = New-Object System.Collections.Generic.List[string]
  $userTables = @($tables.Rows | Where-Object { $_.kind -eq 'USER_TABLE' })
  Write-Host ("  Copying data of {0} tables..." -f $userTables.Count)
  $n = 0
  foreach ($t in $userTables) {
    $n++
    $file = Join-Path $dataDir ($t.sch + '.' + $t.name + '.csv')
    Write-Progress -Activity "Exporting $db" -Status "$($t.name)" -PercentComplete (100 * $n / [math]::Max(1, $userTables.Count))
    $sql = "SELECT * FROM [$($t.sch)].[$($t.name)] WITH (NOLOCK)"
    if ($fast) { $count = [YfExport]::Table($c, $sql, $file) }
    else {
      $cmd = $c.CreateCommand(); $cmd.CommandTimeout = 0; $cmd.CommandText = $sql
      $rd = $cmd.ExecuteReader()
      $w = New-Object System.IO.StreamWriter($file, $false, $utf8)
      $hdr = @(); for ($k = 0; $k -lt $rd.FieldCount; $k++) { $hdr += '"' + $rd.GetName($k).Replace('"','""') + '"' }
      $w.WriteLine(($hdr -join ','))
      $count = 0; $vals = New-Object object[] $rd.FieldCount
      while ($rd.Read()) {
        [void]$rd.GetValues($vals)
        $line = New-Object System.Text.StringBuilder
        for ($k = 0; $k -lt $vals.Length; $k++) { if ($k) { [void]$line.Append(',') }; [void]$line.Append((CsvCell $vals[$k])) }
        $w.WriteLine($line.ToString()); $count++
      }
      $w.Close(); $rd.Close()
    }
    $summary.Add(("{0,-60} {1,12}" -f ($t.sch + '.' + $t.name), $count))
    Write-Host ("  {0,-55} {1,10} rows" -f $t.name, $count)
  }
  [IO.File]::WriteAllLines((Join-Path $dir 'summary.txt'), $summary, $utf8)
  $c.Close()
}

Write-Host ""
Write-Host "Done. Exported to: $outRoot" -ForegroundColor Green
Write-Host "Copy that whole folder to the SanDisk (e.g. SanDisk\YarnFlowExport) and tell Claude."
Read-Host "Press Enter to close"
