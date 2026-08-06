export interface PracticeSettings {
  id: string;
  practiceName: string;
  registrationNumber: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  timezone: string;
}

export interface PracticeSettingsInput {
  practiceName: string;
  registrationNumber?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  logoUrl?: string;
  timezone: string;
}
