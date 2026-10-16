"use client";

export type RoleType =
  | "farmer"
  | "fpo_coordinator"
  | "cold_storage_owner"
  | "truck_driver"
  | "buyer";

export interface UserProfile {
  user_id: string;
  email: string;
  role: RoleType;
  display_name: string;
  phone?: string;
  linked_entity_id?: string;
}

export const DEMO_CREDENTIALS: Record<
  RoleType,
  { email: string; pass: string; title: string; subtitle: string; icon: string; path: string }
> = {
  farmer: {
    email: "farmer@demo.com",
    pass: "demo1234",
    title: "Farmer",
    subtitle: "Ramesh Patel (Greenfield Farms)",
    icon: "",
    path: "/farmer/dashboard",
  },
  fpo_coordinator: {
    email: "fpo@demo.com",
    pass: "demo1234",
    title: "FPO Coordinator",
    subtitle: "Dr. Sunita Deshmukh (Nashik Cluster)",
    icon: "",
    path: "/fpo/dashboard",
  },
  cold_storage_owner: {
    email: "storage@demo.com",
    pass: "demo1234",
    title: "Cold Storage Owner",
    subtitle: "MahaAgro Cold Vault Hub",
    icon: "",
    path: "/cold-storage/dashboard",
  },
  truck_driver: {
    email: "truck@demo.com",
    pass: "demo1234",
    title: "Truck Driver",
    subtitle: "Balwinder Singh (MH-15-AG-4021)",
    icon: "",
    path: "/truck/dashboard",
  },
  buyer: {
    email: "buyer@demo.com",
    pass: "demo1234",
    title: "Commercial Buyer",
    subtitle: "FreshMart Prime Retail (Navi Mumbai)",
    icon: "",
    path: "/buyer/dashboard",
  },
};

const STORAGE_KEY = "harvest_zero_auth_user";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore error
  }
  return null;
}

export function setStoredUser(user: UserProfile | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = "harvest_zero_role=; path=/; max-age=0";
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    document.cookie = `harvest_zero_role=${user.role}; path=/; max-age=86400`;
  }
}

export function loginWithRole(role: RoleType): UserProfile {
  const creds = DEMO_CREDENTIALS[role];
  const user: UserProfile = {
    user_id: `user-${role}-demo`,
    email: creds.email,
    role: role,
    display_name: creds.subtitle,
    phone: "+91-9876543210",
  };
  setStoredUser(user);
  return user;
}
