export interface Practitioner {
  id: string;
  practiceId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  profession: string;
  email: string | null;
  cellphone: string | null;
  colourCode: string;
  consultationDuration: number;
  active: boolean;
}

export interface PractitionerInput {
  firstName: string;
  lastName: string;
  title?: string;
  profession: string;
  email?: string;
  cellphone?: string;
  colourCode: string;
  consultationDuration: number;
}
