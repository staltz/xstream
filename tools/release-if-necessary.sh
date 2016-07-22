#!/bin/bash

# This script checks if xstream needs a new version
# released, then it publishes that new version.

exitstatus=0

echo "> ... checks if xstream needs a new version released, and publishes";
echo "";
needsRelease=0
node $(dirname $0)/check-release.js --oracle || needsRelease=$?;
if [ $needsRelease -eq 1 ]; then
  npm run release-patch || exitstatus=$?;
elif [ $needsRelease -eq 2 ]; then
  npm run release-minor || exitstatus=$?;
elif [ $needsRelease -eq 3 ]; then
  npm run release-major || exitstatus=$?;
fi

exit $exitstatus