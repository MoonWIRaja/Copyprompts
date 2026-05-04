
async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('❌ Error: GEMINI_API_KEY is not set');
    process.exit(1);
  }

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`);
    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to list models');
    }

    console.log('Available Models:');
    data.models.forEach((m: any) => console.log(`- ${m.name}`));
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

listModels();
