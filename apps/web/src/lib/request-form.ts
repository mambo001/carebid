import type { CreateRequestInput } from "./api";

export type RequestFormValues = Pick<CreateRequestInput, "category" | "title"> & {
  readonly sanitizedSummary: string
};

export const requestCategoryOptions = [
  { label: "Specialist consult", value: "specialist_consult" },
  { label: "Imaging", value: "imaging" },
] as const;

export const createInitialRequestValues = (): RequestFormValues => ({
  category: "specialist_consult",
  title: "",
  sanitizedSummary: "",
});
