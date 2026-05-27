import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/statistics")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
});
