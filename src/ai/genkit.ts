import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
<<<<<<< HEAD
  model: 'googleai/gemini-2.5-flash',
=======
  model: 'googleai/gemini-2.0-flash',
>>>>>>> 4af85c7374d71d0fa93206cb12bbd6a9259d36f7
});
