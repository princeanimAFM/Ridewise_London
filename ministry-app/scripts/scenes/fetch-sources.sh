#!/bin/sh
# Downloads the free photos the Sky look is made from (Pexels, 3200 px wide) into scripts/scenes/sources/. Nothing about the app is sent.
set -e
cd "$(dirname "$0")"
mkdir -p sources
for id in 19294597 813269 3905310 14528921 35327803 19757906 \
  19500620 13735083 12315546 1287142 6564097 6331086 2719301 18945828 262662 5232228 11807184 5245865 31788104 4381454 12616695; do
  [ -s "sources/px-$id.jpg" ] || curl -fsSL -o "sources/px-$id.jpg" "https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg?auto=compress&cs=tinysrgb&w=3200"
done
ls -la sources
