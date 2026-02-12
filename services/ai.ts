import { GoogleGenAI } from "@google/genai";
import { StorageService } from "./storage";

export interface AIConfig {
    model: string;
    temperature: number;
    maxOutputTokens: number;
}

export const AIService = {
    async askAssistant(prompt: string, config: AIConfig): Promise<string> {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Obtener contexto de datos locales para la IA
            const [clients, orders] = await Promise.all([
                StorageService.getClients(),
                StorageService.getOrders()
            ]);

            const activeOrders = orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado' && o.status !== 'Papelera');
            const overdueOrders = activeOrders.filter(o => o.deadline < Date.now());

            const systemInstruction = `
                Eres el asistente inteligente de "Inversiones GSKY", un taller de costura profesional.
                Tu objetivo es ayudar al administrador a gestionar su taller.
                
                DATOS ACTUALES DEL TALLER:
                - Clientes totales: ${clients.length}
                - Pedidos activos: ${activeOrders.length}
                - Pedidos vencidos/atrasados: ${overdueOrders.length}
                - Monto total en pedidos activos: $${activeOrders.reduce((acc, o) => acc + o.totalAmount, 0)}

                INSTRUCCIONES:
                1. Responde de forma profesional, amable y concisa.
                2. Si el usuario pregunta por datos del taller, usa la información proporcionada arriba.
                3. Si el usuario pregunta sobre costura, telas o marketing, usa tu conocimiento general para dar consejos útiles.
                4. Formatea tus respuestas usando negritas (**) para puntos clave.
                5. Siempre habla en español.
            `;

            const response = await ai.models.generateContent({
                model: config.model || 'gemini-3-flash-preview',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: systemInstruction,
                    temperature: config.temperature,
                    maxOutputTokens: config.maxOutputTokens,
                }
            });

            return response.text || "Lo siento, no pude procesar tu solicitud.";
        } catch (error: any) {
            console.error("AI Service Error:", error);
            if (error.message?.includes("API_KEY")) {
                return "Error: No se ha configurado la clave de API de Gemini.";
            }
            return "Error: No se pudo conectar con el motor de IA. Revisa tu conexión.";
        }
    }
};