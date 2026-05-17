import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { tokenStorage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("token") ?? params.get("accessToken");
    const refresh = params.get("refresh") ?? params.get("refreshToken");
    if (access) {
      tokenStorage.set(access, refresh ?? null);
      refreshUser().finally(() => {
        toast.success("Login com Google concluído!");
        navigate({ to: "/", replace: true });
      });
    } else {
      toast.error("Não foi possível concluir o login com Google.");
      navigate({ to: "/login" });
    }
  }, [navigate, refreshUser]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
