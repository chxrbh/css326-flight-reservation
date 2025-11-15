import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";

type LocationState = {
  from?: { pathname: string };
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const { login, account } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const redirectPath = useMemo(() => {
    const state = location.state as LocationState | undefined;
    return state?.from?.pathname ?? "/search";
  }, [location.state]);

  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = () => setError(null);

  useEffect(() => {
    if (account) {
      navigate(redirectPath, { replace: true });
    }
  }, [account, redirectPath, navigate]);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetError();
    if (!signIn.email || !signIn.password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(signIn.email, signIn.password);
      toast({
        title: "Welcome back",
        description: "Signed in successfully.",
      });
      navigate("/search");
    } catch (err: any) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetError();
    const { firstName, lastName, email, password } = signUp;
    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required to create a passenger account.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });
      await login(email, password);
      toast({
        title: "Account created",
        description: "Passenger account ready. You are now signed in.",
      });
      navigate("/search");
    } catch (err: any) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create the account. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {mode === "signin"
              ? "Sign in to Flight Reservation"
              : "Create a passenger account"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Enter your credentials to access your dashboard."
              : "Passengers can create their own accounts. Airline or super admins must be added by existing staff."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "signin" ? "default" : "outline"}
              onClick={() => {
                setMode("signin");
                resetError();
              }}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => {
                setMode("signup");
                resetError();
              }}
            >
              Sign Up
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signIn.email}
                  onChange={(event) =>
                    setSignIn((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={signIn.password}
                  onChange={(event) =>
                    setSignIn((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-first">First name</Label>
                  <Input
                    id="signup-first"
                    placeholder="Jane"
                    value={signUp.firstName}
                    onChange={(event) =>
                      setSignUp((prev) => ({
                        ...prev,
                        firstName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-last">Last name</Label>
                  <Input
                    id="signup-last"
                    placeholder="Doe"
                    value={signUp.lastName}
                    onChange={(event) =>
                      setSignUp((prev) => ({
                        ...prev,
                        lastName: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signUp.email}
                  onChange={(event) =>
                    setSignUp((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={signUp.password}
                  onChange={(event) =>
                    setSignUp((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Airline admins must be created by a super admin. Super admin
                accounts can only be inserted directly in the database.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create passenger account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
