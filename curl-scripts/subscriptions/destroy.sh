#!/bin/bash

API="https://morning-ridge-50036.herokuapp.com"
URL_PATH="/subscriptions"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request DELETE \
  --header "Authorization: Bearer ${TOKEN}"

echo
