import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envContent = `NEXT_PUBLIC_API_URL=http://localhost:5000
`;

const envPath = join(__dirname, '.env.local');

try {
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ Dashboard .env.local file created successfully!');
  console.log('📝 Location: dashboard/.env.local');
  console.log('\n💡 Update NEXT_PUBLIC_API_URL if your backend runs on a different port.');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  process.exit(1);
}

