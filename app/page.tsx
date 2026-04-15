"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSessionContext } from "@/components/providers/SessionProvider";

export default function HomePage() {
  const router = useRouter();
  const { isReady, userId } = useSessionContext();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    router.replace(userId ? "/dashboard" : "/login");
  }, [isReady, router, userId]);

  return <div className="flex min-h-screen items-center justify-center text-zinc-400">Loading...</div>;
}
