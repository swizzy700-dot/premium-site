#!/usr/bin/env node
/**
 * Test script to verify Google PageSpeed Insights API key
 * Run: node scripts/test-api-key.mjs YOUR_API_KEY
 */

const API_KEY = process.argv[2] || process.env.PAGESPEED_API_KEY;

if (!API_KEY || API_KEY === "your_api_key_here" || API_KEY === "REPLACE_WITH_REAL_KEY") {
  console.error("❌ ERROR: No valid API key provided");
  console.error("Usage: node scripts/test-api-key.mjs YOUR_API_KEY");
  console.error("   or: PAGESPEED_API_KEY=your_key node scripts/test-api-key.mjs");
  process.exit(1);
}

const TEST_URL = "https://www.google.com";
const API_URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(TEST_URL)}&key=${API_KEY}&category=performance&strategy=mobile`;

console.log("🔍 Testing Google PageSpeed Insights API key...");
console.log(`Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 5)}`);
console.log(`Testing with URL: ${TEST_URL}`);
console.log("");

async function testApiKey() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API ERROR:");
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Error: ${data.error?.message || JSON.stringify(data.error)}`);
      
      if (data.error?.message?.includes("API key not valid")) {
        console.error("");
        console.error("💡 The API key is INVALID. Possible causes:");
        console.error("   1. Key was deleted/revoked in Google Cloud Console");
        console.error("   2. Key has IP/browser restrictions blocking this request");
        console.error("   3. PageSpeed Insights API is not enabled for this project");
        console.error("   4. Wrong key copied (maybe copied the project ID instead?)");
        console.error("");
        console.error("🔧 Fix: Go to https://console.cloud.google.com/apis/credentials");
        console.error("   → Create a new API key");
        console.error("   → Ensure PageSpeed Insights API is enabled");
      }
      
      process.exit(1);
    }

    // Success!
    console.log("✅ API KEY IS VALID!");
    console.log("");
    console.log("📊 Test Results:");
    console.log(`   URL: ${data.id}`);
    console.log(`   Strategy: ${data.analysisUTCTimestamp ? 'mobile/desktop' : 'unknown'}`);
    
    if (data.lighthouseResult) {
      const lhr = data.lighthouseResult;
      console.log("   ✅ lighthouseResult present");
      
      if (lhr.categories?.performance?.score !== undefined) {
        const score = Math.round(lhr.categories.performance.score * 100);
        console.log(`   ✅ Performance score: ${score}/100`);
      }
      
      console.log("");
      console.log("🎉 API key is working correctly!");
      console.log("👉 Copy this key to your .env.local file:");
      console.log(`   PAGESPEED_API_KEY=${API_KEY}`);
    } else {
      console.error("⚠️  Warning: lighthouseResult missing from response");
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
    }
    
  } catch (error) {
    console.error("❌ NETWORK ERROR:");
    console.error(error.message);
    process.exit(1);
  }
}

testApiKey();
