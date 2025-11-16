export type AccessType = "passenger" | "airline-admin" | "super-admin";

export type AccountRecord = {
  account_id: number;
  email: string;
  access_type: AccessType;
  airline_id?: number | null;
};

export type PassengerRecord = {
  passenger_id: number;
  first_name: string;
  last_name: string;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  nationality?: string | null;
  account_id: number;
};

export type AuthAccount = {
  id: number;
  email: string;
  access_type: AccessType;
  name?: string | null;
  airline_id?: number | null;
  passenger_id?: number | null;
};

export type SignInResponse = {
  message: string;
  account: AccountRecord;
  passenger: PassengerRecord | null;
};
