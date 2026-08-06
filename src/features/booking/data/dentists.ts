import type { Dentist } from "../types";

export const dentists: Dentist[] = [
  {
    id: "dr-naidoo",
    firstName: "Anisha",
    lastName: "Naidoo",
    title: "Dr.",
    qualification: "BChD (Pretoria), PDD Aesthetic Dentistry",
    specialInterests: ["Cosmetic dentistry", "Whitening", "Veneers"],
    yearsOfExperience: 14,
    avgConsultationDuration: 30,
  },
  {
    id: "dr-fourie",
    firstName: "Chris",
    lastName: "Fourie",
    title: "Dr.",
    qualification: "BChD (Stellenbosch), MSc Endodontics",
    specialInterests: ["Root canal therapy", "Emergency care"],
    yearsOfExperience: 21,
    avgConsultationDuration: 45,
  },
  {
    id: "dr-adams",
    firstName: "Kayla",
    lastName: "Adams",
    title: "Dr.",
    qualification: "BChD (Witwatersrand)",
    specialInterests: ["General & family dentistry", "Paediatric care"],
    yearsOfExperience: 8,
    avgConsultationDuration: 30,
  },
  {
    id: "dr-mokoena",
    firstName: "Thabo",
    lastName: "Mokoena",
    title: "Dr.",
    qualification: "BChD (Pretoria), MSc Oral Surgery",
    specialInterests: ["Extractions", "Oral surgery", "Implants"],
    yearsOfExperience: 17,
    avgConsultationDuration: 40,
  },
];
