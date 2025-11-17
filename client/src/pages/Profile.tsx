import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  usePassengerProfile,
  useUpdatePassengerProfile,
  useAirlineAdminProfile,
  useUpdateAirlineAdminProfile,
} from "@/hooks/useApiQuery";
import { useToast } from "@/hooks/use-toast";
import { normalizeDateInputValue, formatLocalDate } from "@/lib/datetime";

type PassengerFormState = {
  firstName: string;
  lastName: string;
  gender: "" | "M" | "F";
  dob: string;
  phone: string;
  nationality: string;
};

type AdminFormState = {
  firstName: string;
  lastName: string;
};

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
] as const;

export default function Profile() {
  const { accessType } = useAuth();
  const isPassenger = accessType === "passenger";
  const isAirlineAdmin = accessType === "airline-admin";

  const title = isPassenger
    ? "Passenger Profile"
    : isAirlineAdmin
    ? "Airline Admin Profile"
    : "Profile";

  const description = isPassenger
    ? "Manage the personal information linked to your flight bookings."
    : isAirlineAdmin
    ? "Review your airline administrator details and keep them up to date."
    : "Signed-in passengers and airline administrators can manage their profiles here.";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {isPassenger && <PassengerProfileSection />}
      {isAirlineAdmin && <AirlineAdminProfileSection />}

      {!isPassenger && !isAirlineAdmin && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Profile management is available only for passenger or airline
            administrator accounts.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PassengerProfileSection() {
  const { account, passenger, updatePassenger } = useAuth();
  const passengerId = account?.passenger_id ?? null;
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = usePassengerProfile(passengerId);
  const updateProfile = useUpdatePassengerProfile(passengerId);
  const profileRecord = data ?? passenger ?? null;

  const initialForm = useMemo<PassengerFormState>(
    () => ({
      firstName: passenger?.first_name ?? "",
      lastName: passenger?.last_name ?? "",
      gender: (passenger?.gender as PassengerFormState["gender"]) || "",
      dob: normalizeDateInputValue(passenger?.dob ?? null),
      phone: passenger?.phone ?? "",
      nationality: passenger?.nationality ?? "",
    }),
    [passenger]
  );

  const [form, setForm] = useState<PassengerFormState>(initialForm);

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        gender: (data.gender as PassengerFormState["gender"]) || "",
        dob: normalizeDateInputValue(data.dob ?? null),
        phone: data.phone ?? "",
        nationality: data.nationality ?? "",
      });
    }
  }, [data]);

  const handleChange =
    (field: keyof PassengerFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passengerId) {
      toast({
        title: "Profile unavailable",
        description: "This account is not linked to a passenger record.",
        variant: "destructive",
      });
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Missing details",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    updateProfile.mutate(
      {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        gender: form.gender || null,
        dob: form.dob || null,
        phone: form.phone.trim() ? form.phone.trim() : null,
        nationality: form.nationality.trim() ? form.nationality.trim() : null,
      },
      {
        onSuccess: (updated) => {
          updatePassenger(updated);
          toast({
            title: "Profile updated",
            description: "Your passenger information was saved.",
          });
        },
        onError: (err: any) => {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to update profile at the moment.";
          toast({
            title: "Update failed",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const disabled = isLoading || updateProfile.isPending;
  const queryErrorMessage =
    queryError instanceof Error
      ? queryError.message
      : "Unable to load passenger profile.";

  return (
    <>
      <div className="gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{account?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Access type</p>
              <p className="font-medium">
                {account?.access_type?.replace("-", " ")}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader>
            <CardTitle>Profile status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Passenger ID</p>
              <p className="font-medium">
                {passengerId ?? "Not linked to a passenger record"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last update</p>
              <p className="font-medium">
                {profileRecord
                  ? profileRecord.dob ||
                    profileRecord.phone ||
                    profileRecord.nationality
                    ? "Profile completed"
                    : "Basic profile"
                  : "No profile data"}
              </p>
            </div>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          {!passengerId ? (
            <p className="text-sm text-red-600">
              This account is not connected to a passenger profile. Please
              contact support.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">{queryErrorMessage}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="w-full h-10 rounded-md border px-3 bg-white"
                    value={form.gender}
                    onChange={handleChange("gender")}
                    disabled={disabled}
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange("dob")}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555 123 4567"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Thai"
                    value={form.nationality}
                    onChange={handleChange("nationality")}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={disabled}>
                  {updateProfile.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AirlineAdminProfileSection() {
  const { account, updateAccount } = useAuth();
  const accountId = account?.id ?? null;
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useAirlineAdminProfile(accountId);

  const updateProfile = useUpdateAirlineAdminProfile(accountId);

  const [form, setForm] = useState<AdminFormState>({
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
      });
    }
  }, [data]);

  const handleChange =
    (field: keyof AdminFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountId) {
      toast({
        title: "Profile unavailable",
        description: "No airline administrator record found.",
        variant: "destructive",
      });
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Missing details",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    updateProfile.mutate(
      {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        hire_date: data?.hire_date ?? null,
      },
      {
        onSuccess: (updated) => {
          const fullName = `${updated.first_name ?? ""} ${
            updated.last_name ?? ""
          }`.trim();
          updateAccount({
            name:
              fullName.length > 0
                ? fullName
                : account?.email ?? account?.name ?? "",
          });
          toast({
            title: "Profile updated",
            description: "Administrator information saved.",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Update failed",
            description:
              err instanceof Error
                ? err.message
                : "Unable to update admin profile.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const disabled = isLoading || updateProfile.isPending;
  const queryErrorMessage =
    queryError instanceof Error
      ? queryError.message
      : "Unable to load administrator profile.";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{account?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Access type</p>
              <p className="font-medium">
                {account?.access_type?.replace("-", " ")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Airline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Airline</p>
              <p className="font-medium">{data?.airline_name ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Airline code</p>
              <p className="font-medium">{data?.airline_code ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrator details</CardTitle>
        </CardHeader>
        <CardContent>
          {!accountId ? (
            <p className="text-sm text-red-600">
              This account is missing an airline administrator profile.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading administrator profile...
            </p>
          ) : isError ? (
            <p className="text-sm text-red-600">{queryErrorMessage}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-first-name">First name</Label>
                  <Input
                    id="admin-first-name"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-last-name">Last name</Label>
                  <Input
                    id="admin-last-name"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Employee ID</p>
                  <p className="font-medium">{data?.employee_id ?? "-"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Hire date</p>
                  <p className="font-medium">
                    {data?.hire_date
                      ? formatLocalDate(data.hire_date)
                      : "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={disabled}>
                  {updateProfile.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
