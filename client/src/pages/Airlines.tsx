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

  // Queries
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

  // Local form state
  const [isAddingAirline, setIsAddingAirline] = useState(false);
  const [newAirline, setNewAirline] = useState({
    name: "",
    code: "",
    country: "",
    supportEmail: "",
    supportPhone: "",
  });

  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", country: "", supportEmail: "", supportPhone: "" });

  const handleAddAirline = () => {
    if (!newAirline.name || !newAirline.code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addAirline.mutate(
      { ...newAirline, code: newAirline.code.toUpperCase() },
      {
        onSuccess: () => {
          setNewAirline({ name: "", code: "", country: "", supportEmail: "", supportPhone: "" });
          setIsAddingAirline(false);
          toast({
            title: "Success",
            description: "Airline added successfully",
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

  const handleDeleteAirline = (id: Airline["id"]) => {
    deleteAirline.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Airline deleted successfully",
        });
      },
      onError: (e: any) =>
        toast({
          title: "Delete failed",
          description: e?.message || "Unable to delete airline",
          variant: "destructive",
        }),
    });
  };

  const startEditAirline = (airline: Airline) => {
    setEditingAirline(airline);
    setEditForm({
      name: airline.name,
      code: String(airline.code || "").toUpperCase(),
      country: airline.country || "",
      supportEmail: airline.supportEmail || "",
      supportPhone: airline.supportPhone || "",
    });
  };

  const handleUpdateAirline = () => {
    if (!editingAirline) return;
    if (!editForm.name || !editForm.code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateAirline.mutate(
      {
        id: editingAirline.id,
        updates: { ...editForm, code: editForm.code.toUpperCase() },
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Airline updated successfully",
          });
          setEditingAirline(null);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="text-center py-12">
            Loading airlines…
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="text-center py-12">
            Failed to load airlines: {String(error?.message || error)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Airline Management</h1>
        <Button
          onClick={() => setIsAddingAirline(true)}
          className=" hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Airline
        </Button>
      </div>

      {isAddingAirline && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Add New Airline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Airline Name *</Label>
                <Input
                  id="name"
                  value={newAirline.name}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, name: e.target.value })
                  }
                  placeholder="e.g., Delta Airlines"
                />
              </div>
              <div>
                <Label htmlFor="code">Airline Code *</Label>
                <Input
                  id="code"
                  value={newAirline.code}
                  onChange={(e) =>
                    setNewAirline({
                      ...newAirline,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., DL"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={newAirline.country}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, country: e.target.value })
                  }
                  placeholder="e.g., Thailand"
                />
              </div>
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={newAirline.supportEmail}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, supportEmail: e.target.value })
                  }
                  placeholder="e.g., support@airline.com"
                />
              </div>
              <div>
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  value={newAirline.supportPhone}
                  onChange={(e) =>
                    setNewAirline({ ...newAirline, supportPhone: e.target.value })
                  }
                  placeholder="e.g., +1 555 123 4567"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddAirline}
                disabled={addAirline.isPending}
                className="hover:opacity-90"
              >
                {addAirline.isPending ? "Adding…" : "Add Airline"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingAirline(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingAirline && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Edit Airline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Airline Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="e.g., Delta Airlines"
                />
              </div>
              <div>
                <Label htmlFor="edit-code">Airline Code *</Label>
                <Input
                  id="edit-code"
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., DL"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={editForm.country}
                  onChange={(e) =>
                    setEditForm({ ...editForm, country: e.target.value })
                  }
                  placeholder="e.g., Thailand"
                />
              </div>
              <div>
                <Label htmlFor="edit-support-email">Support Email</Label>
                <Input
                  id="edit-support-email"
                  type="email"
                  value={editForm.supportEmail}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supportEmail: e.target.value })
                  }
                  placeholder="e.g., support@airline.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-support-phone">Support Phone</Label>
                <Input
                  id="edit-support-phone"
                  value={editForm.supportPhone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supportPhone: e.target.value })
                  }
                  placeholder="e.g., +1 555 123 4567"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateAirline}
                disabled={updateAirline.isPending}
                className="hover:opacity-90"
              >
                {updateAirline.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingAirline(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {airlines.length === 0 ? (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Airlines Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first airline to the system.
            </p>
            <Button
              onClick={() => setIsAddingAirline(true)}
              className="hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Airline
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airlines.map((airline) => (
            <Card
              key={airline.id}
              className="bg-gradient-card shadow-card hover:shadow-elegant transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    {airline.name}
                  </CardTitle>
                  <Badge variant="secondary">{airline.code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Country:</strong> {airline.country || "-"}
                  </p>
                  <p>
                    <strong>Support Email:</strong> {airline.supportEmail || "-"}
                  </p>
                  <p>
                    <strong>Support Phone:</strong> {airline.supportPhone || "-"}
                  </p>
                </div>
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => startEditAirline(airline)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAirline(airline.id)}
                    disabled={deleteAirline.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
