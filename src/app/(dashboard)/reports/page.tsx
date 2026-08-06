import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3Icon,
  CalendarXIcon,
  StethoscopeIcon,
  TrendingUpIcon,
  UserXIcon,
  WalletIcon,
} from "lucide-react";

export const metadata = { title: "Reports — iDentalPractice" };

const REPORTS = [
  { title: "Appointments", description: "Volume, duration, and completion rate over time.", icon: BarChart3Icon },
  { title: "No Shows", description: "No-show rate by practitioner and treatment type.", icon: UserXIcon },
  { title: "Patient Growth", description: "New vs. returning patients month over month.", icon: TrendingUpIcon },
  { title: "Revenue", description: "Requires billing — not built yet.", icon: WalletIcon },
  { title: "Popular Treatments", description: "Most-booked treatments by volume and revenue.", icon: StethoscopeIcon },
  { title: "Practitioner Utilisation", description: "Booked hours vs. available working hours.", icon: CalendarXIcon },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Coming soon — placeholders for the reporting suite.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <report.icon className="size-4 text-muted-foreground" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">{report.description}</p>
              <Badge variant="secondary" className="w-fit">
                Placeholder
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
