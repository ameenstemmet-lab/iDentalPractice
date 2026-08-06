export interface Treatment {
  id: string;
  practiceId: string;
  treatmentName: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  colour: string;
  active: boolean;
}

export interface TreatmentInput {
  treatmentName: string;
  description?: string;
  durationMinutes: number;
  price: number;
  colour: string;
}
