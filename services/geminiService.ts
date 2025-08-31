import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { NaverBlogItem } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates SEO-optimized blog topic ideas based on keywords and real Naver search results.
 * @param mainKeyword The primary keyword for the blog post.
 * @param additionalKeywords Supporting keywords to include.
 * @param naverBlogs An optional array of top-ranking Naver blog posts for context.
 * @returns A promise that resolves to an array of 3 topic strings.
 */
export const generateSeoTopics = async (mainKeyword: string, additionalKeywords: string, naverBlogs?: NaverBlogItem[]): Promise<string[]> => {
    try {
        let prompt: string;
        // If we have data from the Naver API, create a more detailed prompt.
        if (naverBlogs && naverBlogs.length > 0) {
            const topTitles = naverBlogs.map(blog => `- "${blog.title.replace(/<[^>]*>/g, '')}"`).join('\n');
            prompt = `
            You are an expert SEO content strategist specializing in Naver blogs in Korea.
            I have just analyzed the Naver API for the keyword "${mainKeyword}" and these are the titles of the current top 10 ranking blog posts:
            ---
            ${topTitles}
            ---
            Based on this live analysis and incorporating the following additional keywords "${additionalKeywords}", please generate 3 compelling, SEO-optimized blog post titles in Korean.
            The titles should be creative, distinct from the list above, and likely to rank high on Naver search.
            Return ONLY a JSON object with a "titles" key containing an array of 3 strings.
            `;
        } else {
            // Fallback to the original prompt if no Naver data is available.
            prompt = `
            You are an expert SEO content strategist specializing in Naver blogs in Korea.
            Imagine you have analyzed the top 10 Naver blog posts for the keyword "${mainKeyword}".
            Based on that analysis and incorporating the following additional keywords "${additionalKeywords}", please generate 3 compelling, SEO-optimized blog post titles in Korean.
            The titles should be catchy and likely to rank high on Naver search.
            Return ONLY a JSON object with a "titles" key containing an array of 3 strings.
            `;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'An SEO-optimized blog post title in Korean.'
                            }
                        }
                    }
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.titles || [];

    } catch (error) {
        console.error("Error in generateSeoTopics:", error);
        throw new Error("Gemini API를 사용하여 블로그 주제를 생성하는 데 실패했습니다.");
    }
};

/**
 * Generates a full blog post from a given title, personalizing it with a blog/company name.
 * @param title The selected blog post title.
 * @param blogName The user's blog or company name to naturally include in the post.
 * @returns A promise that resolves to the full blog post content as a string.
 */
export const generateBlogPost = async (title: string, blogName: string): Promise<string> => {
    try {
        const prompt = `
        You are a helpful and engaging blog writer for Naver blogs.
        Write a high-quality, SEO-friendly blog post in Korean based on the following title: "${title}".
        The post should be well-structured with a clear introduction, a detailed body with multiple paragraphs, and a concluding summary.
        Use engaging language and formatting like bullet points or numbered lists where appropriate to make the post easy to read.
        The tone should be friendly and informative.
        ${blogName ? `Throughout the article, naturally and appropriately mention the blog or company name "${blogName}" where it makes sense to do so.` : ''}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error in generateBlogPost:", error);
        throw new Error("Gemini API를 사용하여 블로그 포스트를 생성하는 데 실패했습니다.");
    }
};

/**
 * Splits a given text into a specified number of paragraphs using Gemini.
 * @param text The full blog post text.
 * @param count The desired number of paragraphs.
 * @returns A promise that resolves to an array of strings, each being a paragraph.
 */
export const splitTextIntoParagraphs = async (text: string, count: number): Promise<string[]> => {
    try {
        const prompt = `
        Analyze the following text and divide it into exactly ${count} coherent and roughly equal-sized paragraphs.
        The text could be in any language, including Korean. Maintain the original tone, meaning, and language.
        
        TEXT:
        ---
        ${text}
        ---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        paragraphs: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'A single paragraph from the divided text.'
                            }
                        }
                    }
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.paragraphs || [];

    } catch (error) {
        console.error("Error in splitTextIntoParagraphs:", error);
        throw new Error("Gemini API를 사용하여 텍스트를 나누는 데 실패했습니다.");
    }
};

/**
 * Creates a visually descriptive image generation prompt from a paragraph of text.
 * @param paragraph The text to analyze. This text may be in Korean.
 * @returns A promise that resolves to a string containing the image prompt in English.
 */
export const createImagePrompt = async (paragraph: string): Promise<string> => {
    try {
        const prompt = `
        Analyze the following paragraph, which may be in Korean. Create a short, visually descriptive prompt in ENGLISH for an image generation model.
        The prompt should capture the main theme, mood, and key subjects of the text.
        Be concise and artistic. Respond with only the English prompt text itself, without any extra formatting or explanation.
        
        PARAGRAPH: "${paragraph}"
        
        PROMPT:
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error in createImagePrompt:", error);
        throw new Error("Gemini API를 사용하여 이미지 프롬프트를 만드는 데 실패했습니다.");
    }
};

/**
 * Generates an image based on a text prompt.
 * @param prompt The image generation prompt.
 * @returns A promise that resolves to a base64 data URL of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("이미지 생성 결과 이미지가 없습니다.");
        }
    } catch (error) {
        console.error("Error in generateImage:", error);
        throw new Error("Imagen API를 사용하여 이미지를 생성하는 데 실패했습니다.");
    }
};

/**
 * Edits an existing image based on a text prompt.
 * @param base64ImageData The base64 encoded string of the source image.
 * @param mimeType The MIME type of the source image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edits.
 * @returns A promise that resolves to a base64 data URL of the edited image.
 */
export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageMimeType = part.inlineData.mimeType;
                return `data:${imageMimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("AI가 수정된 이미지를 반환하지 않았습니다.");

    } catch (error) {
        console.error("Error in editImage:", error);
        throw new Error("Gemini API를 사용하여 이미지를 수정하는 데 실패했습니다.");
    }
};

/**
 * Translates a given text to English.
 * @param text The text to translate (expected to be in Korean).
 * @returns A promise that resolves to the translated English text.
 */
export const translateToEnglish = async (text: string): Promise<string> => {
    try {
        const prompt = `Translate the following Korean text to English. Respond with only the translated text.
        
        Korean: "${text}"
        English:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim().replace(/"/g, ''); // Clean up quotes
    } catch (error) {
        console.error("Error in translateToEnglish:", error);
        throw new Error("Gemini API를 사용하여 텍스트를 번역하는 데 실패했습니다.");
    }
};
