import {
  Activity,
  Apple,
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
  PlusIcon,
  ScanLine,
  Smile,
  Sparkle,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

const SPECIALITIES: Array<{ name: string; icon: LucideIcon }> = [
  { name: "Psychiatry", icon: Brain },
  { name: "General Practitioner", icon: Stethoscope },
  { name: "Dentistry", icon: Smile },
  { name: "Obstetrics & Gynaecology", icon: Baby },
  { name: "Optometry", icon: Eye },
  { name: "Paediatrics", icon: Baby },
  { name: "Dermatology", icon: Sparkle },
  { name: "Orthopaedics", icon: Bone },
  { name: "Cardiology", icon: HeartPulse },
  { name: "Physiotherapy", icon: Activity },
  { name: "ENT", icon: Ear },
  { name: "Radiology", icon: ScanLine },
  { name: "Psychology", icon: BrainCog },
  { name: "Dietician", icon: Apple },
  { name: "Occupational Therapy", icon: Hand },
  { name: "Speech Therapy", icon: MessageCircle },
  { name: "Urology", icon: Droplets },
  { name: "Internal Medicine", icon: Pill },
  { name: "Family Medicine", icon: Users },
];

export function SpecialitiesGrid() {
  return (
    <section id="services" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-wide text-gold-foreground uppercase">No fixed specialty list</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            If it&apos;s a healthcare practice, it fits.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Profession is a free-text field, not a dropdown someone forgot to update. These are
            practices already running on iPractice today — yours doesn&apos;t need to match the list.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2.5">
          {SPECIALITIES.map(({ name, icon: Icon }) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-xs"
            >
              <Icon className="size-3.5 text-primary" />
              {name}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <PlusIcon className="size-3.5" />
            Yours, in seconds
          </span>
        </div>
      </div>
    </section>
  );
}
