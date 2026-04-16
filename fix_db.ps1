$inputFile = "c:\xampp\htdocs\lumbarong-main\database.sql"
$outputFile = "c:\xampp\htdocs\lumbarong-main\lumbarong_cleaned.sql"

$seenConstraints = @{}
$currentTable = ""

# Start with database creation
$finalContent = @(
    "CREATE DATABASE IF NOT EXISTS ``lumbarong``;",
    "USE ``lumbarong``;",
    "SET FOREIGN_KEY_CHECKS=0;",
    ""
)

Get-Content -Path $inputFile -Encoding Unicode | ForEach-Object {
    $line = $_
    
    # Track current table
    if ($line -match 'CREATE TABLE `(.*)`') {
        $currentTable = $matches[1]
    }
    
    # Handle constraints
    if ($line -match 'CONSTRAINT `(.*)_ibfk_.*` FOREIGN KEY \(`(.*)`\) REFERENCES `(.*)` \(`(.*)`\)(.*)') {
        $col = $matches[2]
        $refTable = $matches[3]
        $refCol = $matches[4]
        $rest = $matches[5]
        
        $key = "$currentTable|$col|$refTable|$refCol"
        
        if (-not $seenConstraints.ContainsKey($key)) {
            $seenConstraints[$key] = $true
            $constraintName = $currentTable + "_" + $col + "_fk"
            # Use -f for cleaner string construction
            $newLine = "  CONSTRAINT `{0}` FOREIGN KEY (`{1}`) REFERENCES `{2}` (`{3}`){4}" -f $constraintName, $col, $refTable, $refCol, $rest
            $finalContent += $newLine
        }
    }
    else {
        $finalContent += $line
    }
}

$finalContent += "SET FOREIGN_KEY_CHECKS=1;"

# One more pass to fix trailing commas in table definitions
$fixedContent = @()
for ($i = 0; $i -lt $finalContent.Count; $i++) {
    $currentLine = $finalContent[$i]
    $nextLine = if ($i + 1 -lt $finalContent.Count) { $finalContent[$i+1].Trim() } else { "" }
    
    if ($currentLine.Trim().EndsWith(",") -and $nextLine.StartsWith(")")) {
        $fixedContent += $currentLine.TrimEnd(", ")
    } else {
        $fixedContent += $currentLine
    }
}

$fixedContent | Out-File -FilePath $outputFile -Encoding utf8
Write-Host "Reordered and cleaned SQL saved to $outputFile"
