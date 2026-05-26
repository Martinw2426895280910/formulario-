export interface Report {
  id: string;
  date: string;
  time: string;
  location: "Hospital Público San José" | "CAPS" | "Otro";
  locationDetail: string; // e.g. name of CAPS
  typeOfProblem: string;
  description: string;
  createdAt: string;
}
