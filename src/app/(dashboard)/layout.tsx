import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { PracticeProvider } from "@/components/reception/practice-context";
import { getCurrentPractice } from "@/features/reception/shared/practice-context";

// This shell reads live practice data on every request (and every page
// beneath it reads live appointments/patients/etc via React Query) — none
// of it is safe to statically cache at build time, so the whole route
// group is opted out of static generation.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const practice = await getCurrentPractice();

  return (
    <PracticeProvider
      value={{
        practiceId: practice?.id ?? null,
        practiceName: practice?.practiceName ?? null,
        timezone: practice?.timezone ?? "UTC",
      }}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Navbar practiceName={practice?.practiceName ?? "iDentalPractice"} />
          <main className="flex flex-1 flex-col p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PracticeProvider>
  );
}
