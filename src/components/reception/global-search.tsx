"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePatientSearch } from "@/features/reception/patients/queries";
import { usePracticeContext } from "./practice-context";

/** Top-nav search entry point — currently searches patients by name; the pattern extends to other entities. */
export function GlobalSearch() {
  const { practiceId } = usePracticeContext();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const { data: results, isFetching } = usePatientSearch(practiceId ?? "", term);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function goToPatient(patientId: string) {
    setOpen(false);
    setTerm("");
    router.push(`/patients/${patientId}`);
  }

  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpen(true)}>
        <SearchIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[20%] max-w-md translate-y-0 gap-0 p-0 sm:max-w-md" showCloseButton={false}>
          <DialogTitle className="sr-only">Search patients</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search patients by name…"
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {isFetching ? (
              <p className="px-2.5 py-3 text-sm text-muted-foreground">Searching…</p>
            ) : term && results?.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-muted-foreground">No patients found.</p>
            ) : (
              results?.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => goToPatient(patient.id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
                >
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {patient.firstName} {patient.lastName}
                  </span>
                  {patient.cellphone ? (
                    <span className="ml-auto text-xs text-muted-foreground">{patient.cellphone}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
