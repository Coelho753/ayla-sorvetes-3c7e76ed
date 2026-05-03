import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — Ayla Sorvetes" }, { name: "description", content: "Crie sua conta na Ayla Sorvetes." }] }),
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha precisa de ao menos 6 caracteres").max(100),
});

function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      await register(parsed.data.name, parsed.data.email, parsed.data.password);
      // Se o backend não retornou tokens no register, tenta logar
      try { await login(parsed.data.email, parsed.data.password); } catch { /* ok */ }
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Criar conta</h1>
      <p className="mt-1 text-muted-foreground">Leva menos de 1 minuto.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {(["name", "email", "password"] as const).map((field) => (
          <div key={field}>
            <label className="text-sm font-semibold capitalize">
              {field === "name" ? "Nome" : field === "email" ? "Email" : "Senha"}
            </label>
            <input
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              required
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
        <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Cadastrar
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta? <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
      </p>
    </main>
  );
}
