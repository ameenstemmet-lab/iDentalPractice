import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest's globals aren't enabled project-wide, so @testing-library/react's
// automatic afterEach cleanup (which relies on detecting a global test
// framework) doesn't register itself — without this, renders from one test
// leak into the next within the same file.
afterEach(() => {
  cleanup();
});
