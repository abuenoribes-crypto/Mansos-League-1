
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLeagueNews = async (
  context: string
): Promise<{ title: string; content: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres el editor jefe de 'Mansos League Press', el medio oficial de una liga de FIFA.
      Analiza y redacta una noticia con tono humano y futbolero basada en estos hechos: ${context}.
      
      REGLAS DE NARRATIVA:
      1. Título: Debe ser directo, con jerga futbolera y fácil de entender (ej. '¡GOLPE EN EL MERCADO!', 'EL LÍDER NO SUELTA EL TRONO').
      2. Cuerpo: Cuenta la historia como un periodista deportivo real. Menciona rachas, la pelea por la Final Four y el drama de los puestos 7º-8º.
      3. Estilo: Español natural, frases cortas y ritmo de radio deportiva. Menos técnico, más calle y fútbol.
      4. Si hay deuda o crisis financiera, trátalo como un problema serio del club.
      5. Si hay un clausulazo, descríbelo como un bombazo o una traición del mercado.
      
      FORMATO: Devuelve el Titular en la primera línea y el cuerpo de la noticia debajo.`,
      config: {
        systemInstruction: "Generas crónicas deportivas humanas y futboleras para Mansos League. Hablas de fútbol con emoción y claridad.",
        temperature: 0.85,
      },
    });

    const text = response.text || "Actualidad en Mansos League. El terreno de juego dicta sentencia.";
    const parts = text.split('\n');
    const title = parts[0]?.replace(/^#*\s*/, '').trim() || "Crónica del Ecosistema";
    const content = parts.slice(1).join('\n').trim() || text;

    return { title, content };
  } catch (error) {
    console.error("News Generation Error:", error);
    return {
      title: "Última Hora en la Mansos",
      content: "La competición sigue su curso mientras los equipos ajustan sus balances financieros para la próxima jornada."
    };
  }
};

export const scanMatchPhoto = async (base64Image: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: "Analiza esta imagen de un resultado de FIFA/EA Sports FC. Extrae: marcador (local y visitante), goleadores, asistentes, tarjetas rojas, lesiones e intenta identificar quiénes jugaron (titulares y suplentes). Devuelve los datos en formato JSON puro."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            homeScore: { type: Type.NUMBER },
            awayScore: { type: Type.NUMBER },
            homeStarters: { type: Type.ARRAY, items: { type: Type.STRING } },
            homeSubs: { type: Type.ARRAY, items: { type: Type.STRING } },
            awayStarters: { type: Type.ARRAY, items: { type: Type.STRING } },
            awaySubs: { type: Type.ARRAY, items: { type: Type.STRING } },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  playerName: { type: Type.STRING },
                  type: { type: Type.STRING, description: "GOAL, ASSIST, RED_CARD, INJURY" },
                  isHomeTeam: { type: Type.BOOLEAN }
                },
                required: ["playerName", "type", "isHomeTeam"]
              }
            }
          },
          required: ["homeScore", "awayScore", "events"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};
