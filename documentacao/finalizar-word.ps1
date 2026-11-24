# Abre o .docx gerado no Microsoft Word, cria as listas de ilustrações e de quadros,
# atualiza sumário e numeração das legendas e exporta o PDF.
# Uso (PowerShell, na pasta documentacao):  powershell -ExecutionPolicy Bypass -File finalizar-word.ps1
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
# (busca por padrão sem acentos: o PowerShell 5.1 lê scripts sem BOM como ANSI)
$docx = (Get-ChildItem -Path $raiz -Filter 'Projeto Integrador II*V3.docx' | Select-Object -First 1).FullName
$pdf  = [System.IO.Path]::ChangeExtension($docx, '.pdf')

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($docx)

  # 1) Numera as legendas (campos SEQ) antes de montar as listas
  $doc.Fields.Update() | Out-Null

  # 2) Troca os marcadores pelas listas automáticas (índice de ilustrações)
  function Inserir-Lista($marcador, $rotulo) {
    $r = $doc.Content
    $f = $r.Find
    if ($f.Execute($marcador)) {
      $r.Text = ''
      $doc.TablesOfFigures.Add($r, $rotulo, $true) | Out-Null
    } else { Write-Warning "Marcador $marcador não encontrado" }
  }
  Inserir-Lista '{{LISTA_FIGURAS}}' 'Figura'
  Inserir-Lista '{{LISTA_QUADROS}}' 'Quadro'

  # 3) Atualiza sumário e listas duas vezes (as próprias listas mudam a paginação)
  for ($i = 0; $i -lt 2; $i++) {
    foreach ($t in $doc.TablesOfContents) { $t.Update() | Out-Null }
    foreach ($t in $doc.TablesOfFigures)  { $t.Update() | Out-Null }
  }

  $doc.Save()
  $doc.ExportAsFixedFormat($pdf, 17)   # 17 = PDF
  "Páginas: " + $doc.ComputeStatistics(2)
  $doc.Close()
  "OK"
} finally {
  $word.Quit()
}
