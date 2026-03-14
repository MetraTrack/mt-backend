export interface OpenAIAnalyzeImageInput {
  instructions: string;
  imageBase64: string;
  mimeType: string;
}

export interface OpenAIGenerateTextInput {
  instructions: string;
  payload: unknown;
}

export interface OpenAIResult {
  raw: string;
  parsed: unknown;
}