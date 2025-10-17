// src/pages/Airlines.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAirlines,
  useAddAirline,
  useDeleteAirline,
  useUpdateAirline,
} from "@/hooks/useApiQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Airline = {
  id: number | string;
  name: string;
  code: string;
  country?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
};

export default function Airlines() {
  const { toast } = useToast();

  // Data
  const {
    data: airlines = [],
    isLoading,
    isError,
    error,
  } = useAirlines() as {
    data: Airline[];
    isLoading: boolean;
    isError: boolean;
    error: any;
  };

  // Mutations
  const addAirline = useAddAirline();
  const deleteAirline = useDeleteAirline();
  const updateAirline = useUpdateAirline();

  // Dialog states
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Airline | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    country: "",
    supportEmail: "",
    supportPhone: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    country: "",
    supportEmail: "",
    supportPhone: "",
  });

  // Handlers
  const handleCreate = () => {
    if (!createForm.name || !createForm.code) {
      toast({
        title: "Error",
        description: "Name and code are required.",
        variant: "destructive",
      });
      return;
    }
    addAirline.mutate(
      { ...createForm, code: createForm.code.toUpperCase() },
      {
        onSuccess: () => {
          setCreateForm({
            name: "",
            code: "",
            country: "",
            supportEmail: "",
            supportPhone: "",
          });
          setIsAdding(false);
          toast({
            title: "Success",
            description: "Airline added successfully.",
          });
        },
        onError: (e: any) =>
          toast({
            title: "Add failed",
            description: e?.message || "Unable to add airline",
            variant: "destructive",
          }),
      }
    );
  };

  const handleStartEdit = (a: Airline) => {
    setEditing(a);
    setEditForm({
      name: a.name || "",
      code: String(a.code || "").toUpperCase(),
      country: a.country || "",
      supportEmail: a.supportEmail || "",
      supportPhone: a.supportPhone || "",
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    if (!editForm.name || !editForm.code) {
      toast({
        title: "Error",
        description: "Name and code are required.",
        variant: "destructive",
      });
      return;
    }
    updateAirline.mutate(
      {
        id: editing.id,
        updates: { ...editForm, code: editForm.code.toUpperCase() },
      },
      {
        onSuccess: () => {
          setEditing(null);
          toast({
            title: "Success",
            description: "Airline updated successfully.",
          });
        },
        onError: (e: any) =>
          toast({
            title: "Update failed",
            description: e?.message || "Unable to update airline",
            variant: "destructive",
          }),
      }
    );
  };

  const handleDelete = (id: Airline["id"]) => {
    if (!confirm("Delete this airline?")) return;
    deleteAirline.mutate(id, {
      onSuccess: () =>
        toast({
          title: "Success",
          description: "Airline deleted successfully.",
        }),
      onError: (e: any) =>
        toast({
          title: "Delete failed",
          description: e?.message || "Unable to delete airline",
          variant: "destructive",
        }),
    });
  };

  // Loading / Error
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            Failed to load airlines: {String(error?.message || error)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Airline Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage airlines
          </p>
        </div>

        {/* Add Airline Dialog */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className=" hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Airline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Airline</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Airline Name *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((s) => ({ ...s, name: e.target.value }))
                    }
                    placeholder="e.g., Delta Air Lines"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Airline Code *</Label>
                  <Input
                    id="code"
                    value={createForm.code}
                    onChange={(e) =>
                      setCreateForm((s) => ({
                        ...s,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g., DL"
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={createForm.country}
                    onChange={(e) =>
                      setCreateForm((s) => ({ ...s, country: e.target.value }))
                    }
                    placeholder="e.g., Thailand"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={createForm.supportEmail}
                    onChange={(e) =>
                      setCreateForm((s) => ({
                        ...s,
                        supportEmail: e.target.value,
                      }))
                    }
                    placeholder="e.g., support@airline.com"
                  />
                </div>
                <div>
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={createForm.supportPhone}
                    onChange={(e) =>
                      setCreateForm((s) => ({
                        ...s,
                        supportPhone: e.target.value,
                      }))
                    }
                    placeholder="e.g., +1 555 123 4567"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={addAirline.isPending}
                  className=" hover:opacity-90"
                >
                  {addAirline.isPending ? "Adding…" : "Add Airline"}
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Airlines
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IATA Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Support Email</TableHead>
                <TableHead>Support Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {airlines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No airlines yet. Click <strong>Add Airline</strong> to
                    create one.
                  </TableCell>
                </TableRow>
              ) : (
                airlines.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="secondary">{a.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.country || "-"}</TableCell>
                    <TableCell>{a.supportEmail || "-"}</TableCell>
                    <TableCell>{a.supportPhone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {/* Edit dialog per row */}
                        <Dialog
                          open={editing?.id === a.id}
                          onOpenChange={(open) => !open && setEditing(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEdit(a)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Airline</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-name">
                                    Airline Name *
                                  </Label>
                                  <Input
                                    id="edit-name"
                                    value={editForm.name}
                                    onChange={(e) =>
                                      setEditForm((s) => ({
                                        ...s,
                                        name: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-code">
                                    Airline Code *
                                  </Label>
                                  <Input
                                    id="edit-code"
                                    value={editForm.code}
                                    onChange={(e) =>
                                      setEditForm((s) => ({
                                        ...s,
                                        code: e.target.value.toUpperCase(),
                                      }))
                                    }
                                    maxLength={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-country">Country</Label>
                                  <Input
                                    id="edit-country"
                                    value={editForm.country}
                                    onChange={(e) =>
                                      setEditForm((s) => ({
                                        ...s,
                                        country: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-email">
                                    Support Email
                                  </Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.supportEmail}
                                    onChange={(e) =>
                                      setEditForm((s) => ({
                                        ...s,
                                        supportEmail: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-phone">
                                    Support Phone
                                  </Label>
                                  <Input
                                    id="edit-phone"
                                    value={editForm.supportPhone}
                                    onChange={(e) =>
                                      setEditForm((s) => ({
                                        ...s,
                                        supportPhone: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={handleUpdate}
                                  disabled={updateAirline.isPending}
                                  className="bg-gradient-primary hover:opacity-90"
                                >
                                  {updateAirline.isPending
                                    ? "Saving..."
                                    : "Save Changes"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditing(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(a.id)}
                          disabled={deleteAirline.isPending}
                          aria-label={`Delete ${a.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
