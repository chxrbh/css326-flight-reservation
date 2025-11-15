import { useMemo, useState } from "react";
import { Shield, Trash2, UserPlus2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAirlineAdmins,
  useAirlines,
  useCreateAirlineAdmin,
  useDeleteAirlineAdmin,
} from "@/hooks/useApiQuery";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date";

type AdminForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  airlineId: string;
};

export default function AirlineAccounts() {
  const { data: admins = [], isLoading, isError, error } = useAirlineAdmins();
  const { data: airlines = [] } = useAirlines();
  const createAdmin = useCreateAirlineAdmin();
  const deleteAdmin = useDeleteAirlineAdmin();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdminForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    airlineId: "",
  });

  const airlineLookup = useMemo(() => {
    const map = new Map<number, string>();
    airlines.forEach((airline: any) => {
      map.set(
        Number(airline.id),
        `${airline.name}${
          airline.code ? ` (${String(airline.code).toUpperCase()})` : ""
        }`
      );
    });
    return map;
  }, [airlines]);

  const resetForm = () =>
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      airlineId: "",
    });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.password ||
      !form.airlineId
    ) {
      toast({
        title: "Missing information",
        description: "All fields are required to create an airline admin.",
        variant: "destructive",
      });
      return;
    }
    createAdmin.mutate(
      {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
        airline_id: Number(form.airlineId),
      },
      {
        onSuccess: () => {
          toast({
            title: "Admin created",
            description: "The airline admin can now sign in.",
          });
          resetForm();
          setOpen(false);
        },
        onError: (mutationError: any) =>
          toast({
            title: "Create failed",
            description: mutationError?.message || "Server error",
            variant: "destructive",
          }),
      }
    );
  };

  const handleDelete = (accountId: number) => {
    if (!confirm("Remove this airline admin account?")) return;
    deleteAdmin.mutate(accountId, {
      onSuccess: () =>
        toast({
          title: "Account removed",
          description: "The airline admin no longer has access.",
        }),
      onError: (mutationError: any) =>
        toast({
          title: "Delete failed",
          description: mutationError?.message || "Server error",
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Airline Accounts
        </h1>
        <p className="text-muted-foreground">
          Super admins can create and revoke airline-admin accounts that manage
          their airline&apos;s flights and reservations.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2 w-fit">
              <UserPlus2 className="h-4 w-4 mr-2" />
              New airline admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create airline administrator</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-first">First name</Label>
                  <Input
                    id="admin-first"
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-last">Last name</Label>
                  <Input
                    id="admin-last"
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Airline"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="admin@airline.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Temporary password</Label>
                <Input
                  id="admin-password"
                  type="text"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Generate a secure password"
                />
                <p className="text-xs text-muted-foreground">
                  Share this password securely with the airline administrator.
                  They can change it after signing in.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-airline">Airline</Label>
                <select
                  id="admin-airline"
                  className="w-full h-10 rounded-md border px-3"
                  value={form.airlineId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      airlineId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select airline...</option>
                  {airlines.map((airline: any) => (
                    <option key={airline.id} value={airline.id}>
                      {airline.name}
                      {airline.code ? ` (${airline.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createAdmin.isPending}
              >
                {createAdmin.isPending
                  ? "Creating..."
                  : "Create airline admin"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing airline administrators</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading accounts...
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-red-600">
              Failed to load airline admins:{" "}
              {String(error?.message || error)}
            </div>
          ) : admins.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No airline admin accounts yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hire date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="font-medium">
                        {airlineLookup.get(Number(admin.airlineId)) ??
                          admin.airlineName}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {admin.airlineCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.firstName} {admin.lastName}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{formatDate(admin.hireDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(admin.id)}
                        disabled={deleteAdmin.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
