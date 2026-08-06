import type { Treatment } from "../types";

export const treatments: Treatment[] = [
  {
    id: "check-up",
    name: "General Check-up",
    shortDescription: "A full examination to catch issues early.",
    durationMinutes: 30,
    startingPrice: 450,
  },
  {
    id: "scale-polish",
    name: "Scale & Polish",
    shortDescription: "Professional clean to remove plaque and stains.",
    durationMinutes: 45,
    startingPrice: 650,
  },
  {
    id: "whitening",
    name: "Whitening",
    shortDescription: "Brighten your smile with in-chair whitening.",
    durationMinutes: 60,
    startingPrice: 1800,
  },
  {
    id: "extraction",
    name: "Extraction",
    shortDescription: "Safe, comfortable removal of a problem tooth.",
    durationMinutes: 30,
    startingPrice: 850,
  },
  {
    id: "root-canal",
    name: "Root Canal",
    shortDescription: "Relieve pain and save the natural tooth.",
    durationMinutes: 90,
    startingPrice: 3200,
  },
  {
    id: "crown",
    name: "Crown",
    shortDescription: "Restore a damaged tooth's shape and strength.",
    durationMinutes: 60,
    startingPrice: 4500,
  },
  {
    id: "emergency",
    name: "Emergency Visit",
    shortDescription: "Urgent care for pain, breaks, or trauma.",
    durationMinutes: 30,
    startingPrice: 750,
  },
];
