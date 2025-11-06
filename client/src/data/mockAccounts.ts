export type AccessType = "passenger" | "airline-admin" | "super-admin";

export type MockAccount = {
  id: number;
  name: string;
  email: string;
  access_type: AccessType;
};

export const mockAccounts: MockAccount[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@gmail.com",
    access_type: "passenger",
  },
  {
    id: 2,
    name: "Ava Admin",
    email: "ava.admin@skyair.com",
    access_type: "airline-admin",
  },
  {
    id: 3,
    name: "Sara Super",
    email: "sara.super@globalair.com",
    access_type: "super-admin",
  },
];
