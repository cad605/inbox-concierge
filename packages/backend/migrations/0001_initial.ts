import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql.unsafe(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TYPE user_role AS ENUM ('admin', 'user');
    CREATE TYPE auth_provider_type AS ENUM ('google');
    CREATE TYPE label_type AS ENUM ('system', 'custom');

    CREATE TABLE auth_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'user',
      primary_provider auth_provider_type NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT auth_users_email_length CHECK (length(email) <= 254)
    );

    CREATE UNIQUE INDEX auth_users_email_lower_unique_idx ON auth_users (LOWER(email));

    CREATE TRIGGER update_auth_users_updated_at
      BEFORE UPDATE ON auth_users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TABLE auth_identities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      provider auth_provider_type NOT NULL,
      provider_id TEXT NOT NULL,
      provider_data JSONB NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT auth_identities_provider_provider_id_unique UNIQUE (provider, provider_id)
    );

    CREATE INDEX idx_auth_identities_user_id ON auth_identities (user_id);

    CREATE TABLE auth_sessions (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      provider auth_provider_type NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_agent TEXT NULL,
      ip_address TEXT NULL,
      CONSTRAINT auth_sessions_ip_address_length CHECK (length(ip_address) <= 45)
    );

    CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions (expires_at);
    CREATE INDEX idx_auth_sessions_user_active ON auth_sessions (user_id, expires_at);

    CREATE TABLE oauth_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identity_id UUID NOT NULL REFERENCES auth_identities(id) ON DELETE CASCADE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT NOT NULL,
      scopes TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX idx_oauth_tokens_identity_id ON oauth_tokens (identity_id);

    CREATE TRIGGER update_oauth_tokens_updated_at
      BEFORE UPDATE ON oauth_tokens
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TABLE threads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      snippet TEXT NOT NULL,
      last_message_at TIMESTAMPTZ NOT NULL,
      message_count INTEGER NOT NULL,
      history_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT threads_user_external_id_unique UNIQUE (user_id, external_id)
    );

    CREATE INDEX idx_threads_user_last_message ON threads (user_id, last_message_at DESC);

    CREATE TRIGGER update_threads_updated_at
      BEFORE UPDATE ON threads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      snippet TEXT NOT NULL DEFAULT '',
      body_text TEXT NOT NULL DEFAULT '',
      from_name TEXT,
      from_email TEXT NOT NULL,
      to_header TEXT,
      cc_header TEXT,
      bcc_header TEXT,
      received_at TIMESTAMPTZ NOT NULL,
      external_labels TEXT[] NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT messages_thread_external_id_unique UNIQUE (thread_id, external_id)
    );

    CREATE INDEX idx_messages_thread_id ON messages (thread_id);
    CREATE INDEX idx_messages_external_labels ON messages USING GIN (external_labels);

    CREATE TABLE labels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      prompt TEXT,
      type label_type NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX labels_user_name_lower_unique_idx ON labels (user_id, LOWER(name));

    CREATE TRIGGER update_labels_updated_at
      BEFORE UPDATE ON labels
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    CREATE TABLE message_label_examples (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(label_id, message_id)
    );

    CREATE TABLE message_labels (
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL,
      classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (message_id, label_id, job_id)
    );

    CREATE INDEX idx_labels_user_id ON labels(user_id);
    CREATE INDEX idx_message_label_examples_label_id ON message_label_examples(label_id);
    CREATE INDEX idx_message_label_examples_message_id ON message_label_examples(message_id);
    CREATE INDEX idx_message_labels_label_id ON message_labels(label_id);
    CREATE INDEX idx_message_labels_job_id ON message_labels(job_id);
    CREATE INDEX idx_message_labels_classified_at ON message_labels(message_id, classified_at DESC);

    CREATE TABLE IF NOT EXISTS effect_queue (
      sequence SERIAL PRIMARY KEY,
      id VARCHAR(36) NOT NULL,
      queue_name VARCHAR(100) NOT NULL,
      element TEXT NOT NULL,
      completed BOOLEAN NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_failure TEXT NULL,
      acquired_at TIMESTAMP NULL,
      acquired_by UUID NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_effect_queue_id ON effect_queue (id);
    CREATE INDEX IF NOT EXISTS idx_effect_queue_take ON effect_queue (queue_name, completed, attempts, acquired_at);
    CREATE INDEX IF NOT EXISTS idx_effect_queue_update ON effect_queue (sequence, acquired_by);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_effect_queue_user_inbox_sync_pending_dedupe
      ON effect_queue ((element::jsonb->>'userId'))
      WHERE queue_name = 'user-inbox-sync'
        AND completed = false
        AND attempts < 3;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_effect_queue_message_auto_label_pending_dedupe
      ON effect_queue ((element::jsonb->>'userId'), (element::jsonb->>'messageId'))
      WHERE queue_name = 'message-auto-label'
        AND completed = false
        AND attempts < 3;
`);
});
