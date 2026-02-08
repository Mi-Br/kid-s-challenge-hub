import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CHALLENGES_INPUT_DIR = path.join(__dirname, "../src/content/challenges/dutch-reading");
const IMAGES_OUTPUT_BASE = path.join(__dirname, "../public/images/challenges/dutch-reading");
const IMAGES_PER_CHALLENGE = 3;

// Style guidelines for consistency across all images
const STYLE_GUIDELINES = `
VISUAL CONSISTENCY REQUIREMENTS:
- All images must maintain visual consistency and relate to the text content
- Style: Soft, hand-drawn children's book illustration aesthetic
- Use gentle, rounded shapes with smooth lines
- Apply a warm, inviting color palette with pastels and soft tones
- Avoid sharp edges, harsh shadows, or overly realistic details
- Illustrations should feel cozy, encouraging, and age-appropriate for young readers (4-8 years)

CONSISTENCY GUIDELINES:
- Maintain the same artistic technique across all images for this story
- Use a cohesive, warm color scheme throughout the set
- Keep backgrounds similarly styled with soft, gentle textures (watercolor, soft pencil, gouache aesthetic)
- Characters should maintain consistent appearance across images

TONE:
- Cheerful and motivating
- Gentle and non-threatening
- Celebrates reading and learning
- Inclusive and welcoming
- Create a harmonious set that looks like pages from the same beloved children's book
`;

/**
 * Read all challenge JSON files from the input directory
 */
function readChallenges() {
  try {
    if (!fs.existsSync(CHALLENGES_INPUT_DIR)) {
      throw new Error(`Challenges directory not found: ${CHALLENGES_INPUT_DIR}`);
    }

    const files = fs.readdirSync(CHALLENGES_INPUT_DIR).filter((f) => f.endsWith(".json"));
    console.log(`📚 Found ${files.length} challenge files\n`);

    const challenges = files.map((file) => {
      const filePath = path.join(CHALLENGES_INPUT_DIR, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return { id: content.id, title: content.title, text: content.text, file: filePath };
    });

    return challenges;
  } catch (error) {
    console.error("❌ Error reading challenges:", error.message);
    process.exit(1);
  }
}

/**
 * Create output directory for a challenge if it doesn't exist
 */
function ensureOutputDir(challengeId) {
  const dir = path.join(IMAGES_OUTPUT_BASE, challengeId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generate image prompts based on challenge text
 * Creates 3 different prompts to capture different aspects of the story
 */
function generateImagePrompts(challengeText, challengeTitle) {
  // Split text into sentences to create varied prompts
  const sentences = challengeText.split(/[.!?]+/).filter((s) => s.trim());

  const prompts = [
    `Illustration 1 for children's book "${challengeTitle}":
${challengeText.split("\n")[0] || sentences[0]}

${STYLE_GUIDELINES}

Create a children's book illustration depicting the main scene or subject of this story. Use soft, warm colors and gentle, rounded character designs appropriate for ages 4-8.`,

    `Illustration 2 for children's book "${challengeTitle}":
${sentences.slice(1, 3).join(". ")}

${STYLE_GUIDELINES}

Create a second page illustration continuing the story, maintaining visual consistency with the first image. Show character development or a key moment in the narrative.`,

    `Illustration 3 for children's book "${challengeTitle}":
${sentences.slice(-2).join(". ")}

${STYLE_GUIDELINES}

Create a final illustration concluding the story. Maintain the same artistic style, color palette, and character appearances as the previous images.`,
  ];

  return prompts;
}

/**
 * Generate a single image using Google Generative AI
 */
async function generateImage(prompt, challengeId, imageNumber, genAI) {
  try {
    const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await imageModel.generateContent(prompt);
    const response = result.response;

    // Extract image data from response
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const ext = mimeType === "image/png" ? "png" : "jpg";
            const filename = `image-${imageNumber}.${ext}`;
            const outputDir = ensureOutputDir(challengeId);
            const filepath = path.join(outputDir, filename);

            const buffer = Buffer.from(part.inlineData.data, "base64");
            fs.writeFileSync(filepath, buffer);

            console.log(`  ✓ Image ${imageNumber}: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
            return filepath;
          }
        }
      }
    }

    console.log(`  ⚠ Image ${imageNumber}: No image data in response`);
    return null;
  } catch (error) {
    console.warn(`  ❌ Image ${imageNumber} failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate all images for a single challenge
 */
async function generateChallengeImages(challenge, genAI, challengeNumber, totalChallenges) {
  console.log(`\n[${challengeNumber}/${totalChallenges}] 📖 "${challenge.title}" (${challenge.id})`);

  const imagePrompts = generateImagePrompts(challenge.text, challenge.title);
  const successCount = 0;

  for (let i = 0; i < IMAGES_PER_CHALLENGE; i++) {
    process.stdout.write(`  🎨 Generating image ${i + 1}/${IMAGES_PER_CHALLENGE}... `);
    await generateImage(imagePrompts[i], challenge.id, i + 1, genAI);
  }

  return successCount;
}

/**
 * Main function to orchestrate challenge image generation
 */
async function generateAllChallengeImages() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      throw new Error("No API key found. Please set GOOGLE_API_KEY in .env file");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("🚀 Challenge Image Generator\n");
    console.log("📂 Configuration:");
    console.log(`   Input:  ${CHALLENGES_INPUT_DIR}`);
    console.log(`   Output: ${IMAGES_OUTPUT_BASE}`);
    console.log(`   Images per challenge: ${IMAGES_PER_CHALLENGE}\n`);

    // Read all challenges
    const challenges = readChallenges();

    if (challenges.length === 0) {
      console.log("⚠️  No challenges found to process.");
      return;
    }

    console.log(`\n✨ Starting image generation for ${challenges.length} challenges...\n`);
    console.log("=".repeat(60));

    // Generate images for each challenge
    let totalImagesGenerated = 0;
    for (let i = 0; i < challenges.length; i++) {
      await generateChallengeImages(challenges[i], genAI, i + 1, challenges.length);
      totalImagesGenerated += IMAGES_PER_CHALLENGE;

      // Small delay between challenges to avoid rate limiting
      if (i < challenges.length - 1) {
        console.log("  ⏳ Waiting 2 seconds before next challenge...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ Image generation complete!");
    console.log(`\n📊 Summary:`);
    console.log(`   ✓ Challenges processed: ${challenges.length}`);
    console.log(`   ✓ Total images generated: ${totalImagesGenerated}`);
    console.log(`   📁 Output location: ${IMAGES_OUTPUT_BASE}`);
    console.log("\n✅ All challenge images have been generated and saved!");
  } catch (error) {
    console.error("\n❌ Error during image generation:", error.message);
    process.exit(1);
  }
}

// Run the generator
generateAllChallengeImages();
