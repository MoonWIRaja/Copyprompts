
async function testAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models';

  console.log('\n--- AI Connection Test ---');
  console.log(`Model: ${model}`);
  console.log(`Endpoint: ${endpoint}`);

  if (!apiKey || apiKey === 'your_api_key_here' || !apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not set correctly in .env');
    process.exit(1);
  }

  try {
    console.log('Sending request to Gemini...');
    const response = await fetch(`${endpoint}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, are you working? Respond with "Yes, I am working!" if you can hear me.' }] }]
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to connect');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`\nResponse from AI: "${text}"`);
    console.log('\n✅ AI is working correctly!');
  } catch (error: any) {
    console.error(`\n❌ AI Test Failed: ${error.message}`);
  }
}

testAI();
