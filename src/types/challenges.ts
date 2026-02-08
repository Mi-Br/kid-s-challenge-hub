export interface DutchQuestion {
  question: string;
  acceptableAnswers: string[]; // lowercase variants that are accepted
  hint?: string;
}

export interface DutchChallenge {
  id: string;
  title: string;
  text: string;
  images: { src: string; alt: string }[];
  questions: DutchQuestion[];
  level?: number; // 1, 2, or 3 for beginner, intermediate, advanced
}
