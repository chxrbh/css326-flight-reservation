import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { AccessType } from "@/data/mockAccounts";

type NavItem = {
  path: string;
  label: string;
  allowed: AccessType[];
};

const NAV_ITEMS: NavItem[] = [
  {
    path: "/search",
    label: "Search",
    allowed: ["passenger"],
  },
  {
    path: "/reservation",
    label: "Reservations",
    allowed: ["passenger", "airline-admin", "super-admin"],
  },
  {
    path: "/flight",
    label: "Flights",
    allowed: ["airline-admin", "super-admin"],
  },
  {
    path: "/airlines",
    label: "Airlines",
    allowed: ["super-admin"],
  },
];

export default function RoleNav() {
  const location = useLocation();
  const { accessType } = useAuth();

  if (!accessType) return null;

  const links = NAV_ITEMS.filter((item) => item.allowed.includes(accessType));

  return (
    <nav className="flex gap-4 text-sm mt-3">
      {links.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== "/" && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`pb-2 border-b-2 transition-colors ${
              isActive
                ? "border-primary text-primary font-medium"
                : "border-transparent text-[#D1E2E6] hover:text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
