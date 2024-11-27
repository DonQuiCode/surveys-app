export type QuestionType = 'multiple' | 'single' | 'text';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export interface Survey {
  id?: string;
  title: string;
  description: string;
  questions: Question[];
  authorId: string;
  createdAt: Date;
  isActive: boolean;
  isPublic: boolean;
}