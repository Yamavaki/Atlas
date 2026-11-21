#!/usr/bin/env bash
# baixa as fontes do Google usadas pelo Atlas (woff2) e escreve app/vendor/fontes.css apontando para os arquivos locais
set -e
OUT=../../app/vendor/fontes; mkdir -p "$OUT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&family=Alegreya+Sans:wght@400;500;700&display=swap"
curl -sSL -A "$UA" "$URL" -o fontes-orig.css
cp fontes-orig.css fontes.css
grep -o "https://fonts.gstatic.com/[^)]*" fontes-orig.css | sort -u | while read -r u; do n=$(echo "$u" | sed 's#https://fonts.gstatic.com/##; s#/#_#g'); curl -sSL "$u" -o "$OUT/$n"; sed -i "s#$u#fontes/$n#g" fontes.css; done
mv fontes.css ../../app/vendor/fontes.css
ls -la "$OUT" | head
