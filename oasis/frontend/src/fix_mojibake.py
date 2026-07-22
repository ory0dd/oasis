import os

files = [
    r"c:\Users\Administrador\Downloads\oasis\oasis\frontend\src\components\MyResponsesDashboard.jsx",
    r"c:\Users\Administrador\Downloads\oasis\oasis\frontend\src\components\PsychologistDashboard.jsx"
]

replacements = {
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Ã": "Á",
    "Ã‰": "É",
    "Ã": "Í",
    "Ã“": "Ó",
    "Ãš": "Ú",
    "Ã‘": "Ñ",
    "Â¿": "¿",
    "Â¡": "¡",
    "Ã¼": "ü",
    "Â": ""
}

# Add special cases for broken Í which is often Ã or Ã
replacements["Integraci\uFFFDn"] = "Integración"
replacements["Integracin"] = "Integración"

for path in files:
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        
        # In Node earlier, we saw that the string was literally containing 'c3 b3' which is "Ã³"
        for k, v in replacements.items():
            content = content.replace(k, v)
            
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {path}")
