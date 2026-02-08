# Challenge Image Generation Script

This script generates images for all Dutch reading challenges using Google's Generative AI (Gemini).

## Prerequisites

1. **Google API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. **Install Dependencies**: Make sure you've run `npm install` in the project root

## Setup

### 1. Create `.env` file

Copy `.env.example` to `.env` and add your Google API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
GOOGLE_API_KEY=your-actual-api-key-here
```

### 2. Install Dependencies

```bash
npm install
```

This will install the required packages:
- `@google/generative-ai` - For image generation
- `dotenv` - For environment variable management

## Usage

### Generate Images for All Challenges

```bash
npm run generate:images
```

This will:
1. ✅ Read all challenge JSON files from `src/content/challenges/dutch-reading/`
2. ✅ Extract the text from each challenge
3. ✅ Generate 3 images per challenge using Gemini 2.5 Flash
4. ✅ Save images to `public/images/challenges/dutch-reading/{challenge-id}/image-{1,2,3}.png`
5. ✅ Create directories automatically

## Output Structure

After running the script, you'll have:

```
public/images/challenges/dutch-reading/
├── de-kat/
│   ├── image-1.png
│   ├── image-2.png
│   └── image-3.png
├── de-hond/
│   ├── image-1.png
│   ├── image-2.png
│   └── image-3.png
└── ... (all 12 challenges)
```

## How It Works

1. **Reads Challenges**: Loads all JSON files from the dutch-reading directory
2. **Generates Prompts**: Creates 3 different image prompts based on the challenge text
3. **Generates Images**: Uses Gemini 2.5 Flash to create illustrations
4. **Saves Images**: Stores PNG files in the correct folder structure
5. **Progress Logging**: Shows real-time progress for each challenge

## Example Output

```
🚀 Challenge Image Generator

📂 Configuration:
   Input:  src/content/challenges/dutch-reading
   Output: public/images/challenges/dutch-reading
   Images per challenge: 3

📚 Found 12 challenge files

✨ Starting image generation for 12 challenges...

[1/12] 📖 "De Kat" (de-kat)
  🎨 Generating image 1/3... ✓ Image 1: image-1.png (245.30 KB)
  🎨 Generating image 2/3... ✓ Image 2: image-2.png (238.15 KB)
  🎨 Generating image 3/3... ✓ Image 3: image-3.png (251.42 KB)
```

## Rate Limiting

The script includes a 2-second delay between challenges to avoid API rate limiting. For 12 challenges with 3 images each, expect the process to take approximately 15-20 minutes.

## Troubleshooting

### "No API key found"
- Make sure you've created a `.env` file with your `GOOGLE_API_KEY`
- Check that the API key is valid at https://aistudio.google.com/apikey

### "Challenges directory not found"
- Make sure you're running the script from the project root
- Verify the challenges are in `src/content/challenges/dutch-reading/`

### "No image data in response"
- This occasionally happens with API rate limiting
- Try running the script again after a few minutes

### Image generation is slow
- Google's API can take 30-60 seconds per image
- For 36 total images, expect 15-20 minutes total
- This is normal and necessary for quality illustrations

## Configuration

The script uses hardcoded values for consistency. To modify behavior:

- **Images per challenge**: Edit `IMAGES_PER_CHALLENGE` constant
- **Input directory**: Edit `CHALLENGES_INPUT_DIR` constant
- **Output directory**: Edit `IMAGES_OUTPUT_BASE` constant
- **Style guidelines**: Edit `STYLE_GUIDELINES` string

## Notes

- All images are generated with a children's book illustration aesthetic
- The script maintains visual consistency across all images for each challenge
- Images are PNG format with automatic compression
- Generated images are approximately 200-300 KB each
