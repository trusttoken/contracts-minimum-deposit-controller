#!/bin/bash
set -eu

# Setting Infura or Alchemy key to use for convenience here
export INFURA_KEY="f88abc181a4a45a6bc47bdda05a94944"
#export ALCHEMY_KEY="fbS06B9gi4kYSsliFu_Hj5gamIShXt9I"

# Example usage:
# $ scripts/deployment/guardedRun.sh --network goerli --dry-run
# PRIVATE_KEY=0x123..64

network='mainnet'
args="$@"
dry_run='false'
force='false'

while [[ "$@" ]]; do
  case "$1" in
    --network)
      if [ "$2" ]; then
        network="$2"
        shift 1
      fi
      ;;
    --dry-run)
      dry_run='true'
      ;;
    --force)
      force='true'
      ;;
    -?)
      # ignore
      ;;
  esac
  shift 1
done

# Setting Etherscan key to use for convenience here
if [[ $network == optimism* ]]; then
  export ETHERSCAN_KEY="RPKYAHCE6R2YI7TRV51WS5N8R885RRNXG3" # Use for Optimism & optimistic testnets
else
  export ETHERSCAN_KEY="XQPPJGFR4J3I6PEISYEG4JPETFZ2EF56EX" # Use for Ethereum & testnets
fi

if [[ "${dry_run}" == 'false' ]]; then
    if [[ "$(git status --porcelain)" ]]; then
        echo "Error: git working directory must be empty to run deploy script."
        exit 1
    fi

    if [[ "$(git log --pretty=format:'%H' -n 1)" != "$(cat ./build/canary.hash)" ]]; then
        echo "Error: Build canary does not match current commit hash. Please run pnpm run build."
        exit 1
    fi
fi

# Skip prompt if PRIVATE_KEY variable already exists
if [[ -z "${PRIVATE_KEY:-}" ]]; then
  # Prompt the user for a PRIVATE_KEY without echoing to bash output.
  # Then export PRIVATE_KEY to an environment variable that won't get
  # leaked to bash history.
  #
  # WARNING: environment variables are still leaked to the process table
  # while a process is running, and hence visible in a call to `ps -E`.
  echo "Enter a private key (0x{64 hex chars}) for contract deployment,"
  echo "or leave blank if performing a dry run without authorization."
  read -s -p "PRIVATE_KEY=" PRIVATE_KEY
  export PRIVATE_KEY
fi

# Log file name
network_log="-${network}"
dry_run_log=''
if [[ "${dry_run}" == 'true' ]]; then
  dry_run_log='-dry-run'
fi
timestamp_log="-$(date +%s)"

ts-node ./scripts/deploy.ts \
  --waffle-config ./waffle.json \
  ${args} \
  --out-file "deployments-${network}.json" \
  --log "./cache/deploy${network_log}${dry_run_log}${timestamp_log}.log"
