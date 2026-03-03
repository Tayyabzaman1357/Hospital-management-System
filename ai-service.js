// Gemini AI Service for HealthCare Pro
// Secure AI integration with Google Gemini API

// ⚠️ IMPORTANT: In production, use environment variables or a backend proxy
// For this demo, we'll use a config pattern that can be easily secured

class GeminiAIService {
    constructor() {
        // Default API key - replace with your secure key
        this.apiKey = '';
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.initialized = false;
    }

    /**
     * Initialize the AI service with API key
     * @param {string} apiKey - Your Gemini API key
     */
    initialize(apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            console.warn('Gemini AI: No API key provided. Using fallback mode.');
            this.initialized = false;
            return false;
        }
        this.apiKey = apiKey.trim();
        this.initialized = true;
        console.log('Gemini AI initialized successfully');
        return true;
    }

    /**
     * Make API call to Gemini
     * @param {string} prompt - The prompt to send
     * @param {object} options - Additional options
     * @returns {Promise<string>} - AI response
     */
    async callGemini(prompt, options = {}) {
        if (!this.initialized) {
            throw new Error('AI service not initialized. Please provide API key.');
        }

        const systemInstruction = options.systemInstruction || 'You are a helpful medical assistant.';
        const temperature = options.temperature || 0.7;

        try {
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemInstruction}\n\n${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: options.maxTokens || 2048,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response from AI');
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Gemini AI Error:', error);
            throw error;
        }
    }

    /**
     * Analyze symptoms and provide possible conditions
     * @param {string[]} symptoms - List of symptoms
     * @param {number} age - Patient age
     * @param {string} gender - Patient gender
     * @param {string} history - Medical history
     * @returns {Promise<object>} - AI analysis results
     */
    async analyzeSymptoms(symptoms, age, gender, history) {
        const prompt = `
Analyze the following patient symptoms and provide a medical assessment:

**Patient Information:**
- Age: ${age} years
- Gender: ${gender}
- Medical History: ${history || 'None provided'}

**Current Symptoms:**
${symptoms.map(s => `- ${s}`).join('\n')}

Please provide your response in the following JSON format:
{
    "conditions": ["condition1", "condition2", "condition3"],
    "riskLevel": "low|medium|high",
    "tests": ["test1", "test2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "urgency": "routine|urgent|emergency",
    "explanation": "Brief explanation of the analysis"
}

Be concise but thorough. Consider common conditions first. If symptoms suggest a serious condition, flag it appropriately.
`;

        try {
            const response = await this.callGemini(prompt, {
                systemInstruction: 'You are an experienced medical diagnostic assistant. Analyze symptoms and provide possible conditions, but always recommend consulting a healthcare professional for actual diagnosis.',
                temperature: 0.5
            });

            // Parse JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Fallback parsing if JSON not found
            return {
                conditions: ['Consultation Required'],
                riskLevel: 'medium',
                tests: ['Basic Health Checkup'],
                recommendations: ['Consult a healthcare professional'],
                urgency: 'routine',
                explanation: response
            };

        } catch (error) {
            console.error('Symptom analysis failed:', error);
            throw error;
        }
    }

    /**
     * Generate patient-friendly prescription explanation
     * @param {string} medicines - List of medicines
     * @param {string} diagnosis - Diagnosis
     * @param {boolean} includeUrdu - Whether to include Urdu translation
     * @returns {Promise<object>} - Explanation object
     */
    async explainPrescription(medicines, diagnosis, includeUrdu = false) {
        const prompt = `
Explain the following prescription in simple, patient-friendly language:

**Diagnosis:** ${diagnosis || 'Not specified'}

**Medicines:**
${medicines}

Please provide:
1. Simple explanation of what each medicine does
2. How to take them (timing, with/without food, etc.)
3. Common side effects to watch for
4. Lifestyle recommendations
5. When to follow up with the doctor

Format your response clearly with headings.
${includeUrdu ? '\n6. Also provide a brief Urdu translation of key instructions.' : ''}
`;

        try {
            const response = await this.callGemini(prompt, {
                systemInstruction: 'You are a pharmacist explaining prescriptions to patients in simple, clear language. Avoid medical jargon.',
                temperature: 0.6
            });

            return {
                simple: response,
                lifestyle: this._extractLifestyleTips(response),
                urdu: includeUrdu ? this._extractUrduText(response) : null
            };

        } catch (error) {
            console.error('Prescription explanation failed:', error);
            throw error;
        }
    }

    /**
     * Chat with AI health assistant
     * @param {string} message - User message
     * @param {string[]} conversationHistory - Previous messages
     * @returns {Promise<string>} - AI response
     */
    async chat(message, conversationHistory = []) {
        const prompt = `
${conversationHistory.length > 0 ? 'Previous conversation:\n' + conversationHistory.join('\n') + '\n\n' : ''}
User: ${message}

Assistant:`;

        try {
            const response = await this.callGemini(prompt, {
                systemInstruction: `You are a friendly, knowledgeable health assistant. You can answer general health questions, provide wellness tips, and guide users on when to see a doctor. 
                
IMPORTANT GUIDELINES:
- Always remind users you're an AI, not a doctor
- For serious symptoms, recommend seeing a healthcare professional
- Be empathetic and supportive
- Keep responses concise and clear
- Don't diagnose conditions or prescribe medications
- Provide evidence-based information`,
                temperature: 0.7,
                maxTokens: 1024
            });

            return response;

        } catch (error) {
            console.error('AI chat failed:', error);
            throw error;
        }
    }

    /**
     * Analyze patient records for risk patterns
     * @param {object[]} patientRecords - Array of patient data
     * @returns {Promise<object[]>} - Risk analysis results
     */
    async analyzePatientRisks(patientRecords) {
        const prompt = `
Analyze the following patient records and identify risk patterns:

${JSON.stringify(patientRecords.slice(0, 10), null, 2)}

Identify:
1. Patients with repeated infection patterns
2. Patients with chronic symptoms
3. Potential high-risk medication combinations
4. Patients who need follow-up

Return as JSON array:
[
    {
        "patientId": "id",
        "patientName": "name",
        "riskType": "repeated_infection|chronic|medication|follow_up",
        "riskLevel": "low|medium|high",
        "description": "Explanation of the risk"
    }
]
`;

        try {
            const response = await this.callGemini(prompt, {
                systemInstruction: 'You are a medical data analyst identifying risk patterns in patient records.',
                temperature: 0.4
            });

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];

        } catch (error) {
            console.error('Risk analysis failed:', error);
            return [];
        }
    }

    // Helper methods
    _extractLifestyleTips(text) {
        const lifestyleMatch = text.match(/(lifestyle|diet|exercise|habits)[\s\S]*?(?=\n\n|\n[A-Z]|$)/i);
        return lifestyleMatch ? lifestyleMatch[0] : '';
    }

    _extractUrduText(text) {
        const urduMatch = text.match(/(urdu|اردو)[\s\S]*?(?=\n\n|$)/i);
        return urduMatch ? urduMatch[0] : null;
    }

    /**
     * Get fallback response when AI is not available
     * @param {string} type - Type of fallback
     * @returns {object} - Fallback response
     */
    getFallbackResponse(type) {
        const fallbacks = {
            symptomAnalysis: {
                conditions: ['General Consultation Recommended'],
                riskLevel: 'medium',
                tests: ['Basic Health Checkup', 'CBC'],
                recommendations: ['Consult a healthcare professional for proper evaluation'],
                urgency: 'routine',
                explanation: 'AI service unavailable. Please consult a healthcare professional.'
            },
            prescriptionExplanation: {
                simple: 'AI service unavailable. Please consult your pharmacist for medication instructions.',
                lifestyle: '',
                urdu: null
            },
            chat: 'I apologize, but the AI service is currently unavailable. Please consult a healthcare professional for medical advice.'
        };

        return fallbacks[type] || { error: 'Service unavailable' };
    }
}

// Create singleton instance
const geminiAI = new GeminiAIService();

// Export for use in other modules
export { geminiAI, GeminiAIService };
