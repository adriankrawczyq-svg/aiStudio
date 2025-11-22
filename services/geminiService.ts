import { GoogleGenAI, Type } from "@google/genai";
import { BoundingBox, Difficulty, ArtStyle } from "../types";

// Initialize API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a landscape image with hidden cats based on difficulty and style.
 */
export const generateCatLandscape = async (difficulty: Difficulty, style: ArtStyle): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';

    let catCount = 5;
    let hideStrategy = "";
    
    // SIMPLIFICATION:
    // Instead of "Camouflage" (blending colors), we use "Occlusion & Scale" (Where's Waldo).
    // This makes cats detectable by AI (clear shapes) but hard for humans (clutter/small size).

    switch (difficulty) {
      case 'EASY':
        catCount = 5;
        hideStrategy = "Difficulty EASY: Cats are distinct and fully visible. They are sitting on roofs, paths, or fences. High contrast with the background.";
        break;
      case 'MEDIUM':
        catCount = 8;
        hideStrategy = "Difficulty MEDIUM: Cats are small. Some are peeking from behind trees, windows, or rocks. Use shadows to hide them, but keep their silhouettes visible.";
        break;
      case 'HARD':
        catCount = 12;
        hideStrategy = "Difficulty HARD: 'Hidden Object Game' style. The scene is very cluttered and detailed. Cats are small and partially hidden behind objects. Do NOT blend them into textures (no chameleon effect), but make them small and surrounded by distracting details.";
        break;
    }

    let stylePrompt = "";
    switch (style) {
      case 'MINECRAFT':
        stylePrompt = "Minecraft Voxel Art. Blocky terrain. Cats are 'Ocelot' mobs made of blocks. Clear block outlines.";
        break;
      case 'IMPRESSIONISM':
        stylePrompt = "Impressionist painting (Monet). Visible brushstrokes. Colorful garden scene.";
        break;
      case 'REALISTIC':
        stylePrompt = "High-resolution photography. Sharp focus. Nature scene.";
        break;
      case 'CARTOON':
        stylePrompt = "Clean Vector Art style. Thick outlines, flat colors. 'Where's Waldo' aesthetic.";
        break;
      case 'SKETCH':
        stylePrompt = "Black and white architectural sketch. Clean lines, high contrast.";
        break;
      case 'ABSTRACT':
        stylePrompt = "Geometric abstract art. Clean shapes. Cats are stylized geometric forms.";
        break;
    }

    // Prompt construction
    const prompt = `Generate a ${stylePrompt} landscape.
    
    CORE TASK: Place exactly ${catCount} cats in this scene.
    ${hideStrategy}
    
    CRITICAL RULES FOR AI:
    1. VISIBILITY: Cats must have CLEAR SILHOUETTES. Do not merge them into the walls/grass. The challenge should come from their SIZE and POSITION, not invisibility.
    2. ANATOMY: Cats must look like cats (ears, tails, paws).
    3. COMPOSITION: Wide angle view to allow for small details.
    
    Aspect ratio 4:3.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

/**
 * Analyzes the generated image to find the bounding boxes of the cats.
 */
export const detectCatsInImage = async (base64Image: string, difficulty: Difficulty, style: ArtStyle): Promise<BoundingBox[]> => {
  try {
    // Using Gemini 2.5 Flash for detection
    const model = 'gemini-2.5-flash'; 

    // Simplified detection context. 
    // We trust the generation step made them distinct enough to be "objects".
    let contextHint = "";
    if (style === 'MINECRAFT') contextHint = "Note: This is Voxel Art. Cats look like blocky Ocelots.";
    if (style === 'SKETCH') contextHint = "Note: This is a sketch. Look for outline shapes.";
    if (style === 'ABSTRACT') contextHint = "Note: Abstract art. Look for geometric cat representations.";

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          {
            text: `Task: Find ALL cats in this image. 
            ${contextHint}

            Instructions:
            1. Scan the entire image, especially rooftops, shadows, and behind objects.
            2. Look for cat SILHOUETTES (ears, tails).
            3. Be generous: If a shape looks 70% like a cat, mark it.
            4. Ignore large landscape features, focus on small details.
            
            Return a JSON object with a property 'boxes' containing arrays of [ymin, xmin, ymax, xmax] (0-1000 scale).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.INTEGER },
                  xmin: { type: Type.INTEGER },
                  ymax: { type: Type.INTEGER },
                  xmax: { type: Type.INTEGER },
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const result = JSON.parse(text);
    return result.boxes || [];
  } catch (error) {
    console.error("Detection Error:", error);
    return [];
  }
};
