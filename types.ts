
export interface FormState {
  blogText: string;
  numParagraphs: number;
}

export interface Result {
  paragraph: string;
  prompt: string;
  imageUrl: string;
}

// Represents a single blog item from the Naver Search API response.
export interface NaverBlogItem {
    title: string;
    description: string;
    link: string;
}
