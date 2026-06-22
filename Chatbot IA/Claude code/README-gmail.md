# Système Gmail OAuth2 + Pub/Sub + IA

## Architecture

```
Utilisateur
    │
    ▼
GET /api/auth/google
    │  Génère l'URL OAuth2 avec scopes Gmail
    ▼
Google OAuth2 Consent Screen
    │
    ▼
GET /api/auth/google/callback?code=...&state=userId
    │  Échange le code contre refresh_token
    │  Stocke dans gmail_accounts (Supabase)
    │  Lance users.watch() → Pub/Sub topic
    │  Déclenche initialFullSync (50 derniers emails)
    ▼
Supabase DB (gmail_accounts, gmail_messages)
    │
    ▼
Gmail API → Pub/Sub Topic (Google Cloud)
    │  Notification à chaque nouvel email
    ▼
POST /api/webhooks/gmail
    │  Décode le message base64
    │  Appelle syncGmailHistoryForAccount()
    │  → users.history.list() pour delta
    │  → upsertMessage() pour chaque nouveau message
    │  → triggerAIForMessage() → Mistral AI
    ▼
Supabase DB (gmail_messages + ai_events)
    │
    ▼
Dashboard /dashboard/gmail
    │  Affiche les emails + résumés IA
    │  Permet envoyer / marquer comme lu
    ▼
API Routes (/api/gmail/*)
```

## Variables d'environnement requises

```env
# Google OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/auth/google/callback

# Google Cloud Pub/Sub
GCP_PROJECT_ID=
GCP_PUBSUB_TOPIC=gmail-notifications

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Mistral AI (pour le pipeline IA)
MISTRAL_API_KEY=

# Sécurité cron
CRON_SECRET=
```

## Setup Google Cloud

### 1. Activer les APIs
- Gmail API
- Cloud Pub/Sub API

### 2. Créer le topic Pub/Sub
```bash
gcloud pubsub topics create gmail-notifications
```

### 3. Autoriser Gmail à publier sur le topic
```bash
gcloud pubsub topics add-iam-policy-binding gmail-notifications \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

### 4. Créer la subscription Push (vers votre webhook)
```bash
gcloud pubsub subscriptions create gmail-push-sub \
  --topic=gmail-notifications \
  --push-endpoint=https://votre-domaine.com/api/webhooks/gmail \
  --push-auth-service-account=YOUR_SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com \
  --ack-deadline=30
```

### 5. Créer les credentials OAuth2
Dans Google Cloud Console → APIs & Services → Credentials :
- Type : OAuth 2.0 Client ID
- Application type : Web application
- Authorized redirect URIs : `https://votre-domaine.com/api/auth/google/callback`

## Setup Supabase

Exécuter dans l'ordre :
1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/gmail-schema.sql`

## Sécurité

- Le `refresh_token` est stocké en base. En production, chiffrez-le avec `pgsodium` (Supabase Vault) ou une clé AES côté applicatif avant insertion.
- Le webhook Pub/Sub est protégé par OIDC Bearer token émis par Google. Validez-le en production avec `google-auth-library`.
- Le cron est protégé par `CRON_SECRET` passé en header `Authorization: Bearer`.
- RLS activé sur toutes les tables : chaque utilisateur ne voit que ses propres données.

## Pipeline IA (Mistral)

Pour chaque nouveau message entrant :
1. `triggerAIForMessage()` crée un `ai_event` en statut `pending`
2. `processAIEvent()` appelle Mistral avec `response_format: json_object`
3. Le résultat (summary, tags, priority, needs_reply) est stocké dans `ai_events.result`
4. Le dashboard affiche les tags et le résumé en surbrillance

Pour ajouter d'autres types d'analyse (auto_reply, classification...) :
```ts
await supabase.from('ai_events').insert({
  gmail_message_id: id,
  event_type: 'auto_reply', // nouveau type
  status: 'pending',
})
```

## Renouvellement du watch Gmail

Gmail `users.watch()` expire après 7 jours maximum.
Le cron `/api/cron/renew-gmail-watch` s'exécute chaque jour à 6h et renouvelle automatiquement les watches expirant dans les 24h.

## Routes API disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/google` | Démarre le flux OAuth2 |
| GET | `/api/auth/google/callback` | Reçoit le code, stocke le token |
| POST | `/api/webhooks/gmail` | Webhook Pub/Sub (Gmail push) |
| GET | `/api/gmail/emails` | Liste les emails depuis Supabase |
| POST | `/api/gmail/send` | Envoie un email via Gmail API |
| POST | `/api/gmail/mark-read` | Marque un email comme lu |
| GET | `/api/cron/renew-gmail-watch` | Cron de renouvellement watch |
