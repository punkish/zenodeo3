Hardware Intelligence Tips
Verifying GPU Usage: On your Mac, you can verify if Ollama is using the Metal GPU by running ollama ps in your terminal while a model is running. The Processor column should show 100% GPU.
Optimizing the VPS: For a 24GB RAM VPS with no GPU, the num_thread setting is vital. Setting it to your exact vCPU count (8) prevents context-switching overhead.
Model Pulling: Before running the code, ensure you have pulled the correct versions on each machine:
Mac: ollama pull llama3.1:8b
VPS: ollama pull llama3.2:3b (or other 1.5B/3B variants)

Using a .env file is the professional way to handle this. It allows you to keep your code identical while the environment dictates the behavior.
1. Create the .env files
On your Mac:

bash

```
# .env
APP_ENV=development
MODEL_TYPE=llama
```

# Mac will use its defaults for these if left blank
Use code with caution.

On your Ubuntu VPS: 

bash

```
# .env
APP_ENV=production
MODEL_TYPE=deepseek
OLLAMA_NUM_THREADS=8
OLLAMA_NUM_CTX=2048
```


2. The Updated Boilerplate
First, install dotenv:
bash

```
npm install dotenv ollama
```

Then, use this logic to merge your hardcoded defaults with your environment overrides:
javascript

```
import 'dotenv/config';
import ollama from 'ollama';
import os from 'os';

// 1. Environment & Platform Detection
const isProduction = process.env.APP_ENV === 'production';
const platform = os.platform(); // 'darwin' or 'linux'

// 2. Intelligent Defaults
const DEFAULTS = {
  darwin: {
    llama: 'llama3.1:8b',
    qwen: 'qwen2.5:7b',
    deepseek: 'deepseek-r1:7b',
    num_thread: undefined, // Let Mac manage GPU threads
    num_ctx: 4096
  },
  linux: {
    llama: 'llama3.2:3b',
    qwen: 'qwen2.5:1.5b',
    deepseek: 'deepseek-r1:1.5b',
    num_thread: 8,
    num_ctx: 2048
  }
};

// 3. Resolve Final Configuration
const activePlatform = DEFAULTS[platform] || DEFAULTS.linux;
const selectedKey = process.env.MODEL_TYPE || 'llama';

const finalConfig = {
  model: activePlatform[selectedKey],
  options: {
    num_thread: parseInt(process.env.OLLAMA_NUM_THREADS) || activePlatform.num_thread,
    num_ctx: parseInt(process.env.OLLAMA_NUM_CTX) || activePlatform.num_ctx,
    temperature: 0.7
  }
};

async function chat(prompt) {
  console.log(`--- [${isProduction ? 'PROD' : 'DEV'}] ---`);
  console.log(`Target: ${finalConfig.model} on ${platform}`);

  try {
    const stream = await ollama.chat({
      model: finalConfig.model,
      messages: [{ role: 'user', content: prompt }],
      options: finalConfig.options,
      stream: true,
    });

    for await (const part of stream) {
      process.stdout.write(part.message.content);
    }
  } catch (err) {
    console.error("\nCheck if Ollama is running:", err.message);
  }
}

chat("Identify the best way to monitor CPU usage on a VPS.");
Use code with caution.
```

Why this works for you:
Zero Code Changes: You can git push from Mac and git pull on Ubuntu. The code stays the same; only the local .env file changes.
Performance Tuning: If your VPS feels sluggish, you can simply change OLLAMA_NUM_THREADS in the .env to 4 or 6 to leave some overhead for the OS without touching your script.
Safety: The || fallbacks ensure that if you forget to create a .env file, it defaults to the safe Linux/CPU settings.