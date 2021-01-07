#!/bin/sh

API="https://morning-ridge-50036.herokuapp.com"
URL_PATH="/subscriptions"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request GET \
  --header "Authorization: Bearer ${TOKEN}"

echo
