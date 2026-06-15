"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser } from "../lib/api";

const ADMIN_LOGIN_PATH = "/ops/login";

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const user = getAuthUser();
    if (user?.role === "ADMIN" && pathname !== "/admin" && pathname !== ADMIN_LOGIN_PATH) {
      router.replace("/admin");
      return;
    }
    if (user?.role === "ADMIN" && pathname === ADMIN_LOGIN_PATH) {
      router.replace("/admin");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  return ready ? children : null;
}
