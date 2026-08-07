import Link from "next/link";
import {
  Activity,
  Apple,
  ArrowRightIcon,
  Baby,
  Bone,
  Brain,
  BrainCog,
  Droplets,
  Ear,
  Eye,
  Hand,
  HeartPulse,
  MessageCircle,
  Pill,
  ScanLine,
  Smile,
  Sparkle,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Speciality {
  name: string;
  description: string;
  icon: LucideIcon;
}

const SPECIALITIES: Speciality[] = [
  { name: "Psychiatry", description: "Compassionate mental health care for a balanced life.", icon: Brain },
  { name: "General Practitioner", description: "Your partner in everyday health and wellbeing.", icon: Stethoscope },
  { name: "Dentistry", description: "General, cosmetic and restorative dental care for the whole family.", icon: Smile },
  { name: "Obstetrics & Gynaecology", description: "Complete women's health and maternity care at every stage.", icon: Baby },
  { name: "Optometry", description: "Professional eye care for clearer vision and better living.", icon: Eye },
  { name: "Paediatrics", description: "Gentle, specialised care for infants, children and teens.", icon: Baby },
  { name: "Dermatology", description: "Skin, hair and nail care from routine to specialist concerns.", icon: Sparkle },
  { name: "Orthopaedics", description: "Diagnosis and treatment for bones, joints and muscles.", icon: Bone },
  { name: "Cardiology", description: "Heart health screening, diagnosis and ongoing care.", icon: HeartPulse },
  { name: "Physiotherapy", description: "Movement-focused rehabilitation and injury recovery.", icon: Activity },
  { name: "ENT", description: "Ear, nose and throat care for all ages.", icon: Ear },
  { name: "Radiology", description: "Diagnostic imaging to support an accurate diagnosis.", icon: ScanLine },
  { name: "Psychology", description: "Talk therapy and mental wellbeing support.", icon: BrainCog },
  { name: "Dietician", description: "Personalised nutrition guidance for every goal.", icon: Apple },
  { name: "Occupational Therapy", description: "Practical support to restore everyday independence.", icon: Hand },
  { name: "Speech Therapy", description: "Communication and swallowing therapy for all ages.", icon: MessageCircle },
  { name: "Urology", description: "Specialist care for urinary and reproductive health.", icon: Droplets },
  { name: "Internal Medicine", description: "Complex, adult-focused diagnosis and long-term care.", icon: Pill },
  { name: "Family Medicine", description: "Continuous, whole-family care across every life stage.", icon: Users },
];

export function SpecialitiesGrid() {
  return (
    <section id="services" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">
            Care for every stage of life
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Our Medical Services
          </h2>
          <p className="mt-4 text-muted-foreground">
            A wide range of specialities to meet your healthcare needs, all coordinated through one
            practice.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SPECIALITIES.map(({ name, description, icon: Icon }) => (
            <Link
              key={name}
              href="/booking"
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-base hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-base group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5.5" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-base group-hover:opacity-100">
                Book appointment
                <ArrowRightIcon className="size-3.5 transition-transform duration-base group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
