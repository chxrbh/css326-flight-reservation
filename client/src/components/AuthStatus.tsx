import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AuthStatus() {
  const { account, passenger, accessType, logout } = useAuth();

  const displayName = passenger
    ? `${passenger.first_name} ${passenger.last_name}`.trim()
    : account?.name ?? account?.email ?? "";

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Label className="text-xs uppercase text-muted-foreground">
        {account ? "Signed in as" : "Authentication"}
      </Label>
      {account ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-col">
            <span className="font-medium leading-tight">{displayName}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {account.email} • {accessType?.replace("-", " ")}
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild variant="secondary" size="sm" className="flex-1 sm:flex-none">
              <Link to="/profile">Profile</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex-1 sm:flex-none"
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">
            Sign in or create a passenger account.
          </span>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link to="/auth">Open auth page</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
