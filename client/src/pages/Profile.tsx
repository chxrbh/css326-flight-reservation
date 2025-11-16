import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  usePassengerProfile,
  useUpdatePassengerProfile,
} from "@/hooks/useApiQuery";
import { useToast } from "@/hooks/use-toast";
import { normalizeDateInputValue } from "@/lib/datetime";

type FormState = {
  firstName: string;
  lastName: string;
  gender: "" | "M" | "F";
  dob: string;
  phone: string;
  nationality: string;
};

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
] as const;

export default function Profile() {
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

  const initialForm = useMemo<FormState>(
    () => ({
      firstName: passenger?.first_name ?? "",
      lastName: passenger?.last_name ?? "",
      gender: (passenger?.gender as FormState["gender"]) || "",
      dob: normalizeDateInputValue(passenger?.dob ?? null),
      phone: passenger?.phone ?? "",
      nationality: passenger?.nationality ?? "",
    }),
    [passenger]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        gender: (data.gender as FormState["gender"]) || "",
        dob: normalizeDateInputValue(data.dob ?? null),
        phone: data.phone ?? "",
        nationality: data.nationality ?? "",
      });
    }
  }, [data]);

  const handleChange =
    (field: keyof FormState) =>
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
        nationality: form.nationality.trim()
          ? form.nationality.trim()
          : null,
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Passenger Profile</h1>
        <p className="text-muted-foreground">
          Manage the personal information linked to your flight bookings.
        </p>
      </div>

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
        </Card>
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
    </div>
  );
}
