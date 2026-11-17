import type { ComponentProps, ReactNode } from "react";

/** Componentes visuais básicos, compartilhados pelas telas. */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Titulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold text-slate-900">{children}</h1>
      {acao}
    </div>
  );
}

export function Campo({
  label,
  children,
  dica,
}: {
  label: string;
  children: ReactNode;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-slate-500">{dica}</span>}
    </label>
  );
}

const estiloInput =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${estiloInput} ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${estiloInput} ${className}`} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${estiloInput} ${className}`} />;
}

const estilosBotao = {
  primario: "bg-blue-700 text-white hover:bg-blue-800",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof estilosBotao }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${estilosBotao[variante]} ${className}`}
    />
  );
}

export function Aviso({ tipo, children }: { tipo: "erro" | "ok" | "info"; children: ReactNode }) {
  const cores = {
    erro: "border-red-200 bg-red-50 text-red-800",
    ok: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${cores[tipo]}`}
    >
      {children}
    </div>
  );
}

const coresSelo = {
  verde: "bg-green-100 text-green-800",
  cinza: "bg-slate-100 text-slate-700",
  amarelo: "bg-amber-100 text-amber-800",
  vermelho: "bg-red-100 text-red-800",
  azul: "bg-blue-100 text-blue-800",
};

export function Selo({ cor, children }: { cor: keyof typeof coresSelo; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${coresSelo[cor]}`}>
      {children}
    </span>
  );
}

/** Tela placeholder para módulos ainda não construídos. */
export function EmConstrucao({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <>
      <Titulo>{titulo}</Titulo>
      <Card>
        <p className="mb-3 text-sm text-slate-600">Esta área está em construção. Vai incluir:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
