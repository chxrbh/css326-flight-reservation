import { ShieldCheck, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useApiQuery";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ProfilePage() {
  const { account } = useAuth();
  const accountId = account?.id ?? null;
  const { data, isLoading, isError, error } = useProfile(accountId);

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
            <CardTitle>Passenger details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="First name" value={data.passenger.first_name} />
            <ProfileField label="Last name" value={data.passenger.last_name} />
            <ProfileField label="Gender" value={data.passenger.gender} />
            <ProfileField
              label="Date of birth"
              value={formatDate(data.passenger.dob)}
            />
            <ProfileField label="Phone" value={data.passenger.phone} />
            <ProfileField
              label="Nationality"
              value={data.passenger.nationality}
            />
          </CardContent>
        </Card>
      ) : data?.airlineAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Airline administrator
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="First name" value={data.airlineAdmin.first_name} />
            <ProfileField label="Last name" value={data.airlineAdmin.last_name} />
            <ProfileField
              label="Airline"
              value={`${data.airlineAdmin.airline_name} (${data.airlineAdmin.airline_code})`}
            />
            <ProfileField
              label="Hire date"
              value={formatDate(data.airlineAdmin.hire_date)}
            />
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
