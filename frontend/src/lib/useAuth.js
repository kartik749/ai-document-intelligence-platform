"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";

export function useAuthGuard() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
    } else {
      setTimeout(() => setChecked(true), 0);
    }
  }, [router]);

  return checked;
}