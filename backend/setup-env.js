import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a random JWT secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/sitegenesis
JWT_SECRET=${generateSecret()}
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
`;

const envPath = join(__dirname, '.env');

try {
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ Backend .env file created successfully!');
  console.log('📝 Location: backend/.env');
  console.log('\n⚠️  IMPORTANT: Update the following values:');
  console.log('   1. MONGODB_URI - Your MongoDB connection string');
  console.log('   2. OPENAI_API_KEY or GEMINI_API_KEY - At least one AI API key');
  console.log('   3. JWT_SECRET - Already generated, but you can change it');
  console.log('\n💡 See SETUP_INSTRUCTIONS.md for detailed setup guide.');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

