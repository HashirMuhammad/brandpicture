
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface AdParameters {
  brandName: string;
  slogan: string;
  actualPrice: string;
  salePrice: string;
  currency: string;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  productImage: string | null;
  conceptImage: string | null;
  logoImage: string | null;
}

export interface GeneratedAd {
  url: string;
  timestamp: number;
  prompt: string;
}

declare global {
  /**
   * Define AIStudio interface within the global scope to ensure it merges correctly
   * with any existing definitions provided by the platform, resolving identity mismatch errors.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Declared without the readonly modifier to match existing global object definitions
     * and avoid 'identical modifiers' errors during interface merging.
     */
    aistudio: AIStudio;
  }
}