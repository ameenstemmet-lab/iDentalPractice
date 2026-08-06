export interface Dentist {
  id: string;
  practiceId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  cellphone: string | null;
  colourCode: string;
  consultationDuration: number;
  active: boolean;
}

export interface DentistInput {
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  cellphone?: string;
  colourCode: string;
  consultationDuration: number;
}
