#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/seed-demo.sh
# Fills a local backend with demo people, posts, follows and a chat so the signed-in Maestro
# flows have something to render. Verification codes are read from Mailpit. Safe to rerun.

API="${API:-http://localhost:8080}"
MAILPIT="${MAILPIT:-http://localhost:8025}"
PASSWORD="${DEMO_PASSWORD:-correct-horse}"
HEADERS=(-H "Content-Type: application/json" -H "X-App-Platform: android" -H "X-App-Version: 99.0.0")

call() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local auth=()
  [ -n "$token" ] && auth=(-H "Authorization: Bearer $token")
  curl -sS -X "$method" "${HEADERS[@]}" "${auth[@]}" ${body:+--data "$body"} "$API/$path"
}

verification_code() {
  local email="$1" id
  for _ in $(seq 20); do
    id="$(curl -sS "$MAILPIT/api/v1/search?query=to:$email" | jq -r '.messages[0].ID // empty')"
    [ -n "$id" ] && break
    sleep 1
  done
  curl -sS "$MAILPIT/api/v1/message/$id" | jq -r '.Text' | grep -oE '\b[0-9]{6}\b' | head -1
}

declare -A TOKEN ID

person() {
  local username="$1" name="$2" email="$1@devhub.dev" signup code
  signup="$(call POST auth/signup "" "$(jq -nc --arg u "$username" --arg n "$name" --arg e "$email" --arg p "$PASSWORD" \
    '{username:$u, displayName:$n, email:$e, password:$p}')")"
  if [ "$(jq -r '.error.code // empty' <<<"$signup")" = "" ]; then
    code="$(verification_code "$email")"
    call POST auth/verify-email "" "$(jq -nc --arg e "$email" --arg c "$code" '{email:$e, code:$c}')" >/dev/null
  fi
  TOKEN[$username]="$(call POST auth/login "" "$(jq -nc --arg i "$email" --arg p "$PASSWORD" '{identifier:$i, password:$p}')" \
    | jq -er '.data.accessToken')"
  ID[$username]="$(call GET users/me "${TOKEN[$username]}" | jq -er '.data.id')"
  call PUT users/me/topics "${TOKEN[$username]}" '{"slugs":["kotlin","devops","open-source"]}' >/dev/null
  call PUT users/me/setup-completion "${TOKEN[$username]}" >/dev/null
  echo "ready: @$username"
}

post() {
  local username="$1" body="$2" code="${3:-}" language="${4:-}"
  call POST posts "${TOKEN[$username]}" "$(jq -nc --arg b "$body" --arg c "$code" --arg l "$language" \
    '{body:$b, code:(if $c == "" then null else $c end), codeLanguage:(if $l == "" then null else $l end)}')" >/dev/null
}

person ada "Ada Lovelace"
person grace "Grace Hopper"
person linus "Linus Torvalds"
person margaret "Margaret Hamilton, Apollo Guidance Software Lead"

for other in grace linus margaret; do
  call PUT "users/me/following/${ID[$other]}" "${TOKEN[ada]}" >/dev/null
  call PUT "users/me/following/${ID[ada]}" "${TOKEN[$other]}" >/dev/null
done

post grace "Shipped a compiler pass that folds constant ranges. Benchmarks in the thread."
post linus "Reminder that a one-line fix deserves a one-paragraph commit message explaining why." \
  'git commit -m "sched: avoid double-accounting runnable time when a task migrates between CPUs during wakeup"' bash
post margaret "Priority displays saved the landing. Design for the overload you hope never comes." \
  'fun schedule(jobs: List<Job>): List<Job> = jobs.sortedWith(compareByDescending<Job> { it.priority }.thenBy { it.deadline })' kotlin
post ada "First post from the device matrix. Averylongunbrokenidentifierthatshouldwrapinsteadofoverflowingthecard_v2_final"

conversation="$(call POST conversations/direct "${TOKEN[grace]}" "$(jq -nc --arg u "${ID[ada]}" '{userId:$u}')" | jq -er '.data.id')"
for line in "Did the matrix run finish?" "Small screen still clips the footer I think" \
  "Here is the stack trace, long lines included: java.lang.IllegalStateException at com.application.devhub.chat.ChatService.send(ChatService.java:128)"; do
  call POST "conversations/$conversation/messages" "${TOKEN[grace]}" \
    "$(jq -nc --arg b "$line" --arg id "$(cat /proc/sys/kernel/random/uuid)" '{clientMessageId:$id, body:$b, code:null, codeLanguage:null, replyToId:null}')" >/dev/null
done
call POST "conversations/$conversation/accept" "${TOKEN[ada]}" >/dev/null || true

echo "Seeded. Sign in as ada@devhub.dev / $PASSWORD"
