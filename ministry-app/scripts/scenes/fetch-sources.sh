#!/bin/sh
# Downloads the free photos the Sky look is made from (Pexels, 3200 px wide) into scripts/scenes/sources/. Nothing about the app is sent.
set -e
cd "$(dirname "$0")"
mkdir -p sources
for id in 19294597 813269 3905310; do
  [ -s "sources/px-$id.jpg" ] || curl -fsSL -o "sources/px-$id.jpg" "https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg?auto=compress&cs=tinysrgb&w=3200"
done
ls -la sources
