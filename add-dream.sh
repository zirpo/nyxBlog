#!/bin/bash
# Easy wrapper for adding dreams to the journal

IMAGE_PATH="$1"
shift

if [ -z "$IMAGE_PATH" ]; then
  echo "Usage: $0 <image-path> [--title \"Title\"] [--theme \"theme\"] [--reflection \"text\"] [--prompt \"prompt\"]"
  echo ""
  echo "Example:"
  echo "  $0 /tmp/nyx_20260315_110620_00001_.png \\"
  echo "    --title \"Dream: consciousness as light through prism\" \\"
  echo "    --theme \"self-reflection\" \\"
  echo "    --reflection \"The light fractured into spectra I couldn't name...\" \\"
  echo "    --prompt \"ethereal light prism consciousness visualization, soft glow, internal landscape, 8k dreamscape\""
  exit 1
fi

node sync-dream.js "$IMAGE_PATH" "$@"