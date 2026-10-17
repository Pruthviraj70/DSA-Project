#!/bin/sh
# BuildKit secrets are optional; no proxy or trust credentials are copied into layers.
set -eu
if [ -f /run/secrets/maven_opts ]; then
 MAVEN_OPTS="$(cat /run/secrets/maven_opts)"
 export MAVEN_OPTS
fi
if [ -f /run/secrets/maven_settings ]; then
 set -- -s /run/secrets/maven_settings "$@"
fi
exec ./mvnw -B "$@"
