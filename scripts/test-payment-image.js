/**
 * Test payment OCR against a local screenshot.
 * Usage: node scripts/test-payment-image.js [path-to-image]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { openai } = require('../backend/src/lib/clients/openai.client');
const {
  PAYMENT_IMAGE_EXTRACTION_PROMPT,
  validatePaymentRules,
} = require('../backend/src/services/paymentService');

const imagePath =
  process.argv[2] ||
  path.join(
    __dirname,
    '../assets/c__Users_Engineer_AppData_Roaming_Cursor_User_workspaceStorage_01c30705975c91490fbcd8b5a76d01d1_images_WhatsApp_Image_2026-06-05_at_3.52.54_PM-a8acc5ad-8c52-47f8-9070-272df4ea41f8.png'
  );

async function main() {
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  const base64 = fs.readFileSync(imagePath).toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 400,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: PAYMENT_IMAGE_EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';
  console.log('GPT raw:\n', raw, '\n');

  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  console.log('Parsed:', JSON.stringify(parsed, null, 2));

  const result = validatePaymentRules(parsed);
  console.log('\nValidation:', result);
  process.exit(result.isValid ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
