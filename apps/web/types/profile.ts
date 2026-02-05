export type AgeRange =
  | "lt_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_64"
  | "65_plus"
  | "unknown";

export type JobType = "w2" | "1099" | "unknown";
export type PayFrequency = "weekly" | "biweekly" | "semi-monthly" | "monthly" | "unknown";
export type NetIncomeRange = "lt_1500" | "1500_2500" | "2500_4000" | "gt_4000" | "unknown";
export type RentStatus = "rent" | "parents" | "dorm" | "other" | "unknown";
export type DebtStatus = "none" | "student_loans" | "credit_card" | "both";
export type CreditCardStatus = "no_card" | "have_not_used" | "use_sometimes" | "use_often";
export type EmergencyBufferRange = "zero" | "lt_500" | "500_2000" | "gt_2000";
export type Priority = "save" | "credit" | "debt" | "unsure";

export type ProfileUpdate = {
  age_range?: AgeRange | null;
  job_type?: JobType | null;
  state?: string | null;
  pay_frequency?: PayFrequency | null;
  net_income_range?: NetIncomeRange | null;
  rent_status?: RentStatus | null;
  debt_status?: DebtStatus | null;
  credit_card_status?: CreditCardStatus | null;
  emergency_buffer_range?: EmergencyBufferRange | null;
  priority?: Priority | null;
  interests?: string[] | null;
};

export type Profile = ProfileUpdate & {
  user_id?: string;
};
