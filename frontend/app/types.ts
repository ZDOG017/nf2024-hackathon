// app/types.ts
export interface Application {
  name: string;
  email: string;
  verdict?: string;
  // Добавьте другие поля, которые есть в вашей заявке
}

export interface EvaluationResult {
  verdict: string;
  explanation: string;
}