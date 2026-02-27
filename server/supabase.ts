import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  Supabase credentials not configured - conversation history will not persist",
  );
}

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Initialize conversations table if it doesn't exist
export async function initializeDatabase() {
  if (!supabase) return;

  try {
    // Check if conversations table exists by trying to fetch with limit 1
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .limit(1);

    if (error && error.code === "42P01") {
      // Table doesn't exist, create it
      console.log("Creating conversations table...");
      // Note: In production, you should manually create this table via Supabase dashboard
      // For now, we'll log that it needs to be created
      console.warn("⚠️  Conversations table not found. Create it with:");
      console.warn(`
        CREATE TABLE conversations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL UNIQUE,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "service role can manage conversations"
        ON conversations FOR ALL
        USING (true)
        WITH CHECK (true);
      `);
    } else if (!error) {
      console.log("✓ Conversations table is ready");
    }
  } catch (err) {
    console.warn("⚠️  Database initialization check skipped");
  }
}
