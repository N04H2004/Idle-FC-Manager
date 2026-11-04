#!/usr/bin/env bash
# Crée l'archive à envoyer sur CrazyGames (index.html à la racine du zip).
set -euo pipefail
cd "$(dirname "$0")"
rm -f idle-fc-manager-crazygames.zip
zip -9 -X idle-fc-manager-crazygames.zip index.html
echo "OK : idle-fc-manager-crazygames.zip"
