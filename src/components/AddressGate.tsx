import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import { useAuth, type Address } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const addressSchema = z.object({
  cep: z.string().trim().min(8, "CEP inválido").max(10),
  rua: z.string().trim().min(2, "Informe a rua").max(120),
  numero: z.string().trim().min(1, "Informe o número").max(10),
  complemento: z.string().trim().max(60).optional().or(z.literal("")),
  bairro: z.string().trim().min(2, "Informe o bairro").max(80),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.string().trim().length(2, "UF com 2 letras"),
});

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Informe seu nome").max(60),
  lastName: z.string().trim().min(2, "Informe seu sobrenome").max(80),
  phone: z.string().trim().regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Telefone inválido"),
});

/**
 * Modal global. Quando o usuário está logado mas não tem endereço cadastrado,
 * abre automaticamente para forçar o preenchimento antes de navegar pelos produtos.
 */
export function AddressGate() {
  const { user, updateAddress, refreshUser } = useAuth();
  const [addr, setAddr] = useState<Address>({});
  const [busy, setBusy] = useState(false);
  const [cepBusy, setCepBusy] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });

  const missingProfile = useMemo(() => {
    if (!user) return false;
    return !user.firstName || !user.lastName || !user.phone;
  }, [user]);
  const needsAddress = !!user && !user.address?.rua;
  const open = !!user && (missingProfile || needsAddress);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
      });
      setAddr(user.address ?? {});
    }
  }, [user]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepBusy(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (d.erro) return;
      setAddr((a) => ({
        ...a,
        cep: clean,
        rua: d.logradouro || a.rua,
        bairro: d.bairro || a.bairro,
        cidade: d.localidade || a.cidade,
        estado: d.uf || a.estado,
      }));
    } catch { /* ignore */ }
    finally { setCepBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missingProfile) {
      const p = profileSchema.safeParse(profile);
      if (!p.success) { toast.error(p.error.issues[0].message); return; }
    }
    let parsedAddr: z.infer<typeof addressSchema> | null = null;
    if (needsAddress) {
      const parsed = addressSchema.safeParse(addr);
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
      parsedAddr = parsed.data;
    }
    setBusy(true);
    try {
      if (missingProfile) {
        const full = `${profile.firstName} ${profile.lastName}`.trim();
        await api.put("/users/me", {
          nome: full,
          name: full,
          firstName: profile.firstName,
          lastName: profile.lastName,
          sobrenome: profile.lastName,
          telefone: profile.phone,
          phone: profile.phone,
        });
      }
      if (parsedAddr) {
        await updateAddress({ ...parsedAddr, estado: parsedAddr.estado.toUpperCase() });
      } else {
        await refreshUser();
      }
      toast.success("Cadastro completo! Bom apetite 🍦");
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Complete seu cadastro</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Precisamos de algumas informações para concluir seu cadastro e entregar seus pedidos.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {missingProfile && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" value={profile.firstName} onChange={(v) => setProfile({ ...profile, firstName: v })} />
                <Field label="Sobrenome" value={profile.lastName} onChange={(v) => setProfile({ ...profile, lastName: v })} />
              </div>
              <Field label="Telefone (WhatsApp)" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            </>
          )}
          {needsAddress && (
          <>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="CEP"
              value={addr.cep ?? ""}
              onChange={(v) => { setAddr({ ...addr, cep: v }); lookupCep(v); }}
              extra={cepBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            />
            <Field label="Número" value={addr.numero ?? ""} onChange={(v) => setAddr({ ...addr, numero: v })} />
          </div>
          <Field label="Rua" value={addr.rua ?? ""} onChange={(v) => setAddr({ ...addr, rua: v })} />
          <Field label="Complemento (opcional)" value={addr.complemento ?? ""} onChange={(v) => setAddr({ ...addr, complemento: v })} />
          <Field label="Bairro" value={addr.bairro ?? ""} onChange={(v) => setAddr({ ...addr, bairro: v })} />
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <Field label="Cidade" value={addr.cidade ?? ""} onChange={(v) => setAddr({ ...addr, cidade: v })} />
            <Field label="UF" value={addr.estado ?? ""} onChange={(v) => setAddr({ ...addr, estado: v.toUpperCase() })} />
          </div>
          </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-display font-bold text-primary-foreground shadow-button hover:scale-[1.01] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar e continuar
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, extra,
}: { label: string; value: string; onChange: (v: string) => void; extra?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {label} {extra}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
