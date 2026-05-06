import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — Ayla Sorvetes" }, { name: "description", content: "Crie sua conta na Ayla Sorvetes." }] }),
  component: RegisterPage,
});

const schema = z.object({
  firstName: z.string().trim().min(2, "Nome muito curto").max(60),
  lastName: z.string().trim().min(2, "Sobrenome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha precisa de ao menos 6 caracteres").max(100),
  cep: z.string().trim().min(8, "CEP inválido").max(10),
  rua: z.string().trim().min(2, "Rua obrigatória").max(120),
  numero: z.string().trim().min(1, "Número obrigatório").max(10),
  complemento: z.string().trim().max(60).optional().or(z.literal("")),
  bairro: z.string().trim().min(2, "Bairro obrigatório").max(80),
  cidade: z.string().trim().min(2, "Cidade obrigatória").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
});

type Form = z.infer<typeof schema>;
const initial: Form = {
  firstName: "", lastName: "", email: "", password: "",
  cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
};

function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        estado: data.uf || f.estado,
      }));
    } catch { /* ignore */ }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const d = parsed.data;
      await register({
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        password: d.password,
        address: {
          cep: d.cep, rua: d.rua, numero: d.numero,
          complemento: d.complemento || undefined,
          bairro: d.bairro, cidade: d.cidade, estado: d.estado.toUpperCase(),
        },
      });
      try { await login(d.email, d.password); } catch { /* ok */ }
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Criar conta</h1>
      <p className="mt-1 text-muted-foreground">Cadastre-se para salvar pedidos e endereço.</p>

      <div className="mt-6">
        <GoogleButton label="Cadastrar com Google" />
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou com email <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" value={form.firstName} onChange={(v) => set("firstName", v)} />
          <Field label="Sobrenome" value={form.lastName} onChange={(v) => set("lastName", v)} />
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
        <Field label="Senha" type="password" value={form.password} onChange={(v) => set("password", v)} />

        <h2 className="pt-2 font-display text-lg font-semibold">Endereço de entrega</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CEP" value={form.cep} onChange={(v) => set("cep", v)} onBlur={() => lookupCep(form.cep)} />
          <Field label="Número" value={form.numero} onChange={(v) => set("numero", v)} />
        </div>
        <Field label="Rua" value={form.rua} onChange={(v) => set("rua", v)} />
        <Field label="Complemento (opcional)" value={form.complemento ?? ""} onChange={(v) => set("complemento", v)} />
        <Field label="Bairro" value={form.bairro} onChange={(v) => set("bairro", v)} />
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <Field label="Cidade" value={form.cidade} onChange={(v) => set("cidade", v)} />
          <Field label="UF" value={form.estado} onChange={(v) => set("estado", v.toUpperCase())} />
        </div>

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

function Field({ label, value, onChange, type = "text", onBlur }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
