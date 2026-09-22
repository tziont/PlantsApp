"use client";

import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await signOut();
        router.push("/auth");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
