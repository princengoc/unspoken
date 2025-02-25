// src/lib/supabase/__tests__/connection.test.ts
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log("🔍 Testing Supabase connection...");

  try {
    // Test basic connection
    const { error: connectionError } = await supabase
      .from("cards")
      .select("count");
    if (connectionError) throw connectionError;
    console.log("✅ Successfully connected to Supabase");

    // Test cards table exists and can be queried
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("*")
      .limit(1);

    if (cardsError) throw cardsError;
    console.log("✅ Cards table exists and is queryable");
    console.log(`ℹ️ Found ${cards.length} cards`);

    // Test category filtering
    const categories = [
      "light & playful",
      "self & growth",
      "life & legacy",
      "love & relationships",
      "vulnerability & truths",
    ];
    for (const category of categories) {
      const { data: categoryCards, error: categoryError } = await supabase
        .from("cards")
        .select("*")
        .eq("category", category);

      if (categoryError) throw categoryError;
      console.log(
        `📊 Category "${category}": ${categoryCards?.length || 0} cards`,
      );
    }

    // Test depth filtering
    for (const depth of [1, 2, 3]) {
      const { data: depthCards, error: depthError } = await supabase
        .from("cards")
        .select("*")
        .eq("depth", depth);

      if (depthError) throw depthError;
      console.log(`📊 Depth ${depth}: ${depthCards?.length || 0} cards`);
    }

    // Get and display a sample card
    const { data: sampleCard, error: sampleError } = await supabase
      .from("cards")
      .select("*")
      .limit(1)
      .single();

    if (sampleError) throw sampleError;
    console.log("\n📋 Sample card:", JSON.stringify(sampleCard, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run the test
testSupabaseConnection()
  .then(() => {
    console.log("\n✨ All tests completed");
  })
  .catch((error) => {
    console.error("\n❌ Tests failed:", error);
    process.exit(1);
  });
