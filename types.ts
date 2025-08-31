
export type ImageSource = 'generate' | 'upload';
export type ImageEditStatus = 'pending' | 'uploaded' | 'asis' | 'editing' | 'translating' | 'done' | 'error';

export interface FormState {
  blogText: string;
  numParagraphs: number;
  blogName: string;
  imageSource: ImageSource;
}

export interface Result {
  paragraph: string;
  prompt: string; // The prompt used for generation, or a description for uploaded/edited images
  imageUrl: string; // Final image URL (generated, uploaded, or edited)
  
  // For uploaded images
  uploadedImageFile?: File;
  originalImageUrl?: string; // base64 URL of the uploaded image
  editPrompt?: string; // User-provided prompt for editing
  editStatus: ImageEditStatus;
}

// Represents a single blog item from the Naver Search API response.
export interface NaverBlogItem {
    title: string;
    description: string;
    link: string;
}
