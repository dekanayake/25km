#!/bin/bash
set -eu

docker run --rm -v $(pwd):/var/task lambci/lambda:build-nodejs12.x npm install
docker run --rm -v $(pwd):/var/task lambci/lambda:build-nodejs12.x zip -r places-service.zip  .