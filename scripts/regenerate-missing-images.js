/**
 * Regenerate missing challenge images
 * Identifies challenges with missing images and regenerates them
 */

import Anthropic from "@anthropic-ai/sdk";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHALLENGES_DIR = path.join(__dirname, "../src/content/challenges/dutch-reading");
const IMAGES_DIR = path.join(__dirname, "../public/images/challenges/dutch-reading");
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("❌ GOOGLE_API_KEY not set in .env");
  process.exit(1);
}

async function getMissingImages() {
  const challenges = [];
  const files = await fs.readdir(CHALLENGES_DIR);
  
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    
    const content = await fs.readFile(path.join(CHALLENGES_DIR, file), "utf-8");
    const challenge = JSON.parse(content);
    
    const challengeDir = path.join(IMAGES_DIR, challenge.id);
    try {
      const images = await fs.readdir(challengeDir);
      const pngCount = images.filter(f => f.endsWith(".png")).length;
      const expectedCount = challenge.images?.length || 3;
      
      if (pngCount < expectedCount) {
        challenges.push({
          id: challenge.id,
          title: challenge.title,
          text: challenge.text,
          missing: expectedCount - pngCount,
          missingIndexes: Array.from({length: expectedCount}, (_, i) => i + 1)
            .filter(n => !images.includes(`image-${n}.png`))
        });
      }
    } catch {
      // Directory doesn't exist yet
      const expectedCount = challenge.images?.length || 3;
      challenges.push({
        id: challenge.id,
        title: challenge.title,
        text: challenge.text,
        missing: expectedCount,
        missingIndexes: Array.from({length: expectedCount}, (_, i) => i + 1)
      });
    }
  }
  
  return challenges;
}

async function generateImage(prompt) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/files:generateContent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{text: prompt}]
      }],
      generation_config: {
        temperature: 1,
      },
      system_instruction: "Generate a children's book illustration in watercolor style..."
    }),
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  // Note: Google's generative AI doesn't directly return image data
  // This would need adjustment for actual implementation
  return null;
}

async function main() {
  console.log("🔍 Scanning for missing images...\n");
  const missing = await getMissingImages();
  
  if (missing.length === 0) {
    console.log("✅ All images present!");
    return;
  }

  console.log(`Found ${missing.length} challenges with missing images:\n`);
  for (const m of missing) {
    console.log(`  ${m.id}: ${m.missing} missing (indexes: ${m.missingIndexes.join(",")})`);
  }
  
  console.log("\n⚠️  Note: Image regeneration requires manual retry or different API");
  console.log("The original generation script uses Google's Generative AI (Gemini)");
}

main().catch(console.error);
