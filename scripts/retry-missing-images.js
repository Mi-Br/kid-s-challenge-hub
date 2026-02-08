import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHALLENGES_INPUT_DIR = path.join(__dirname, "../src/content/challenges/dutch-reading");
const IMAGES_OUTPUT_BASE = path.join(__dirname, "../public/images/challenges/dutch-reading");

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
`;

function readChallenge(challengeId) {
  const filePath = path.join(CHALLENGES_INPUT_DIR, `${challengeId}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return { id: content.id, title: content.title, text: content.text };
}

function generateImagePrompts(challengeText, challengeTitle) {
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

async function generateImage(prompt, challengeId, imageNumber, genAI) {
  try {
    const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await imageModel.generateContent(prompt);
    const response = result.response;

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const ext = mimeType === "image/png" ? "png" : "jpg";
            const filename = `image-${imageNumber}.${ext}`;
            const outputDir = path.join(IMAGES_OUTPUT_BASE, challengeId);
            const filepath = path.join(outputDir, filename);

            const buffer = Buffer.from(part.inlineData.data, "base64");
            fs.writeFileSync(filepath, buffer);
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    console.warn(`  ❌ Failed: ${error.message}`);
    return false;
  }
}

async function retryMissingImages() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key found");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const missingImages = [
    { challengeId: "de-kat", imageNumber: 2 },
    { challengeId: "het-eten", imageNumber: 1 },
    { challengeId: "het-weer", imageNumber: 2 },
  ];

  console.log("🔄 Retrying missing images...\n");

  for (const missing of missingImages) {
    const challenge = readChallenge(missing.challengeId);
    const prompts = generateImagePrompts(challenge.text, challenge.title);
    const prompt = prompts[missing.imageNumber - 1];

    process.stdout.write(`📖 ${challenge.title} - Image ${missing.imageNumber}... `);
    const success = await generateImage(prompt, challenge.id, missing.imageNumber, genAI);

    if (success) {
      console.log(`✓ Generated (${(fs.statSync(path.join(IMAGES_OUTPUT_BASE, challenge.id, `image-${missing.imageNumber}.png`)).size / 1024).toFixed(2)} KB)`);
    } else {
      console.log("⚠ Failed - API issue");
    }

    // Delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n✨ Retry complete!");
}

retryMissingImages().catch(console.error);
