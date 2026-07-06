#!/usr/bin/env bash
# One-time migration: repoint all API Gateway routes from the old JWT "cognito"
# authorizer to the new Lambda "cairn-request" authorizer.
#
# Usage:
#   ./infrastructure/scripts/migrate-api-authorizer.sh dev
#   ./infrastructure/scripts/migrate-api-authorizer.sh prod
#
# Dev often uses a separate AWS profile:
#   AWS_PROFILE=cairn-dev ./infrastructure/scripts/migrate-api-authorizer.sh dev
#
# Override API name directly if needed:
#   API_NAME=cairn-dev ./infrastructure/scripts/migrate-api-authorizer.sh
#
# Requires: aws cli, jq
set -euo pipefail

ENVIRONMENT="${1:-${ENVIRONMENT:-prod}}"
REGION="${AWS_REGION:-us-east-2}"
API_NAME="${API_NAME:-cairn-${ENVIRONMENT}}"

case "$ENVIRONMENT" in
  dev|prod) ;;
  *)
    echo "ERROR: environment must be 'dev' or 'prod' (got: $ENVIRONMENT)"
    exit 1
    ;;
esac

command -v jq >/dev/null || { echo "jq is required"; exit 1; }

echo "Migrating ${API_NAME} (region=${REGION}${AWS_PROFILE:+, profile=${AWS_PROFILE}})"

API_ID=$(aws apigatewayv2 get-apis --region "$REGION" \
  --query "Items[?Name=='${API_NAME}'].ApiId | [0]" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  echo "ERROR: API ${API_NAME} not found"
  exit 1
fi

OLD_AUTH=$(aws apigatewayv2 get-authorizers --api-id "$API_ID" --region "$REGION" \
  --query "Items[?Name=='cognito'].AuthorizerId | [0]" --output text)

NEW_AUTH=$(aws apigatewayv2 get-authorizers --api-id "$API_ID" --region "$REGION" \
  --query "Items[?Name=='cairn-request'].AuthorizerId | [0]" --output text)

echo "API_ID=$API_ID"
echo "OLD cognito authorizer=$OLD_AUTH"
echo "NEW cairn-request authorizer=$NEW_AUTH"

if [ -z "$NEW_AUTH" ] || [ "$NEW_AUTH" = "None" ]; then
  echo "ERROR: cairn-request authorizer not found — run terraform apply far enough to create it first"
  exit 1
fi

if [ -z "$OLD_AUTH" ] || [ "$OLD_AUTH" = "None" ]; then
  echo "No old cognito authorizer — nothing to migrate"
  exit 0
fi

ROUTES_JSON=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" --output json)

UPDATED=0
SKIPPED=0

while IFS= read -r route; do
  ROUTE_ID=$(echo "$route" | jq -r '.RouteId')
  ROUTE_KEY=$(echo "$route" | jq -r '.RouteKey')
  AUTH_TYPE=$(echo "$route" | jq -r '.AuthorizationType // "NONE"')
  AUTH_ID=$(echo "$route" | jq -r '.AuthorizerId // ""')

  if [ "$AUTH_ID" = "$OLD_AUTH" ] || [ "$AUTH_TYPE" = "JWT" ]; then
    echo "Updating $ROUTE_KEY ..."
    aws apigatewayv2 update-route \
      --api-id "$API_ID" \
      --route-id "$ROUTE_ID" \
      --region "$REGION" \
      --authorization-type CUSTOM \
      --authorizer-id "$NEW_AUTH" \
      --output text >/dev/null
    UPDATED=$((UPDATED + 1))
  else
    SKIPPED=$((SKIPPED + 1))
  fi
done < <(echo "$ROUTES_JSON" | jq -c '.Items[]')

echo ""
echo "Updated $UPDATED routes, skipped $SKIPPED"

REMAINING=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" --output json \
  | jq -r --arg old "$OLD_AUTH" '[.Items[] | select(.AuthorizerId == $old) | .RouteKey[]] | .[]')

if [ -n "$REMAINING" ]; then
  echo "ERROR: routes still on old authorizer:"
  echo "$REMAINING"
  exit 1
fi

echo "All routes migrated for ${API_NAME}."
echo "Re-run terraform apply in infrastructure/terraform/environments/${ENVIRONMENT}"
