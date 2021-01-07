#!/bin/bash

API="https://morning-ridge-50036.herokuapp.com"
URL_PATH="/subscriptions"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
  "subscription": {
    "name": "'"${NAME}"'",
    "description": "'"${DESCRIPTION}"'",
    "start": "'"${START}"'",
    "end": "'"${END}"'",
    "owner": "'"${OWNER}"'"
    }
  }'

echo
