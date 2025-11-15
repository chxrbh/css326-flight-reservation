import { ShieldCheck, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  useProfile,
  useUpdateAirlineAdminProfile,
  useUpdatePassengerProfile,
} from "@/hooks/useApiQuery";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatDateDisplay(value?: string | null) {
  if (!value) return "-";
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;

  if (ISO_DATE_REGEX.test(value)) {
    const [y, m, d] = value.split("-").map((part) => Number(part));
    year = y;
    month = m;
    day = d;
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  }

  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const yy = String(year).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function toEditableDate(value?: string | null) {
  if (!value) return "";
  if (ISO_DATE_REGEX.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y.slice(-2)}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}`;
}

function fromEditableDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (ISO_DATE_REGEX.test(trimmed)) return trimmed;
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => part.trim());
    const dd = Number(day);
    const mm = Number(month);
    const yy =
      year.length === 2
        ? Number(`20${year}`)
        : Number(year.length === 4 ? year : year.padStart(4, "0"));
    if (
      Number.isNaN(dd) ||
      Number.isNaN(mm) ||
      Number.isNaN(yy) ||
      dd <= 0 ||
      mm <= 0 ||
      mm > 12 ||
      dd > 31
    ) {
      return null;
    }
    const pad = (val: number) => String(val).padStart(2, "0");
    return `${String(yy).padStart(4, "0")}-${pad(mm)}-${pad(dd)}`;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProfilePage() {
  const { account } = useAuth();
  const accountId = account?.id ?? null;
  const { data, isLoading, isError, error } = useProfile(accountId);
  const { toast } = useToast();

  const passengerMutation = useUpdatePassengerProfile(accountId);
  const adminMutation = useUpdateAirlineAdminProfile(accountId);

  const [passengerForm, setPassengerForm] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    phone: "",
    nationality: "",
  });

  const [adminForm, setAdminForm] = useState({
    first_name: "",
    last_name: "",
    hire_date: "",
  });
  const [editingPassenger, setEditingPassenger] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(false);

  const hydratePassengerForm = useCallback(() => {
    if (!data?.passenger) return;
    setPassengerForm({
      first_name: data.passenger.first_name ?? "",
      last_name: data.passenger.last_name ?? "",
      gender: data.passenger.gender ?? "",
      dob: toEditableDate(data.passenger.dob),
      phone: data.passenger.phone ?? "",
      nationality: data.passenger.nationality ?? "",
    });
  }, [data?.passenger]);

  const hydrateAdminForm = useCallback(() => {
    if (!data?.airlineAdmin) return;
    setAdminForm({
      first_name: data.airlineAdmin.first_name ?? "",
      last_name: data.airlineAdmin.last_name ?? "",
      hire_date: toEditableDate(data.airlineAdmin.hire_date),
    });
  }, [data?.airlineAdmin]);

  useEffect(() => {
    hydratePassengerForm();
  }, [hydratePassengerForm]);

  useEffect(() => {
    hydrateAdminForm();
  }, [hydrateAdminForm]);

  const handleTogglePassenger = useCallback(() => {
    if (editingPassenger) {
      hydratePassengerForm();
    }
    setEditingPassenger((prev) => !prev);
  }, [editingPassenger, hydratePassengerForm]);

  const handleToggleAdmin = useCallback(() => {
    if (editingAdmin) {
      hydrateAdminForm();
    }
    setEditingAdmin((prev) => !prev);
  }, [editingAdmin, hydrateAdminForm]);

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-muted-foreground">
        Sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle2 className="h-8 w-8" />
          Account Profile
        </h1>
        <p className="text-muted-foreground">
          Review your account details and role-specific information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Email</div>
            <div className="font-medium">{account.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <div className="text-xs uppercase text-muted-foreground">
                Access type
              </div>
              <div className="font-medium capitalize">
                {account.access_type.replace("-", " ")}
              </div>
            </div>
            <Badge variant="secondary">{account.access_type}</Badge>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading profile...
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            Failed to load profile: {String(error?.message || error)}
          </CardContent>
        </Card>
      ) : data?.passenger ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Passenger details</CardTitle>
              <Button
                type="button"
                variant={editingPassenger ? "outline" : "default"}
                onClick={handleTogglePassenger}
              >
                {editingPassenger ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingPassenger ? (
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                passengerMutation.mutate(
                  {
                    ...passengerForm,
                    dob: fromEditableDate(passengerForm.dob),
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Profile updated",
                        description: "Passenger information saved.",
                      });
                      setEditingPassenger(false);
                    },
                    onError: (mutationError: any) =>
                      toast({
                        title: "Update failed",
                        description:
                          mutationError?.message || "Unable to save profile.",
                        variant: "destructive",
                      }),
                  }
                );
              }}
            >
                <ProfileInput
                  label="First name"
                  value={passengerForm.first_name}
                  onChange={(value) =>
                    setPassengerForm((prev) => ({ ...prev, first_name: value }))
                  }
                />
                <ProfileInput
                  label="Last name"
                  value={passengerForm.last_name}
                  onChange={(value) =>
                    setPassengerForm((prev) => ({ ...prev, last_name: value }))
                  }
                />
                <ProfileInput
                  label="Gender"
                  value={passengerForm.gender}
                  onChange={(value) =>
                    setPassengerForm((prev) => ({ ...prev, gender: value }))
                  }
                />
                <ProfileInput
                  label="Date of birth"
                  value={passengerForm.dob}
                  placeholder="dd/mm/yy"
                  onChange={(value) =>
                    setPassengerForm((prev) => ({ ...prev, dob: value }))
                  }
                />
                <ProfileInput
                  label="Phone"
                  value={passengerForm.phone}
                  onChange={(value) =>
                    setPassengerForm((prev) => ({ ...prev, phone: value }))
                  }
                />
                <ProfileInput
                  label="Nationality"
                  value={passengerForm.nationality}
                  onChange={(value) =>
                    setPassengerForm((prev) => ({
                      ...prev,
                      nationality: value,
                    }))
                  }
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={passengerMutation.isPending}
                  >
                    {passengerMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField label="First name" value={data.passenger.first_name} />
                <ProfileField label="Last name" value={data.passenger.last_name} />
                <ProfileField label="Gender" value={data.passenger.gender} />
                <ProfileField
                  label="Date of birth"
                  value={formatDateDisplay(data.passenger.dob)}
                />
                <ProfileField label="Phone" value={data.passenger.phone} />
                <ProfileField
                  label="Nationality"
                  value={data.passenger.nationality}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : data?.airlineAdmin ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Airline administrator
              </CardTitle>
              <Button
                type="button"
                variant={editingAdmin ? "outline" : "default"}
                onClick={handleToggleAdmin}
              >
                {editingAdmin ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingAdmin ? (
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                adminMutation.mutate(
                  {
                    ...adminForm,
                    hire_date: fromEditableDate(adminForm.hire_date),
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: "Profile updated",
                        description: "Administrator information saved.",
                      });
                      setEditingAdmin(false);
                    },
                    onError: (mutationError: any) =>
                      toast({
                        title: "Update failed",
                        description:
                          mutationError?.message || "Unable to save profile.",
                        variant: "destructive",
                      }),
                  }
                );
              }}
            >
                <ProfileInput
                  label="First name"
                  value={adminForm.first_name}
                  onChange={(value) =>
                    setAdminForm((prev) => ({ ...prev, first_name: value }))
                  }
                />
                <ProfileInput
                  label="Last name"
                  value={adminForm.last_name}
                  onChange={(value) =>
                    setAdminForm((prev) => ({ ...prev, last_name: value }))
                  }
                />
                <ProfileField
                  label="Airline"
                  value={`${data.airlineAdmin.airline_name} (${data.airlineAdmin.airline_code})`}
                />
                <ProfileInput
                  label="Hire date"
                  value={adminForm.hire_date}
                  placeholder="dd/mm/yy"
                  onChange={(value) =>
                    setAdminForm((prev) => ({ ...prev, hire_date: value }))
                  }
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={adminMutation.isPending}
                  >
                    {adminMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  label="First name"
                  value={data.airlineAdmin.first_name}
                />
                <ProfileField
                  label="Last name"
                  value={data.airlineAdmin.last_name}
                />
                <ProfileField
                  label="Airline"
                  value={`${data.airlineAdmin.airline_name} (${data.airlineAdmin.airline_code})`}
                />
                <ProfileField
                  label="Hire date"
                  value={formatDateDisplay(data.airlineAdmin.hire_date)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Super admins currently have no additional profile fields.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
