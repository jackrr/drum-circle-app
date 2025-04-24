set -euo pipefail

docker build . -t jackratner/drum-circle-app

docker push jackratner/drum-circle-app
