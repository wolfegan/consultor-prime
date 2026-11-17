"use client";

import { useState } from "react";

/** Mostra a senha provisória uma única vez, para o admin copiar e repassar. */
export function SenhaProvisoria({ senha }: { senha: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="mb-2">
        Senha provisória (aparece só agora; o usuário vai trocá-la no primeiro acesso):
      </p>
      <div className="flex items-center gap-2">
        <code className="rounded bg-white px-2 py-1 font-mono text-base">{senha}</code>
        <button
          type="button"
          className="text-xs underline"
          onClick={() => {
            navigator.clipboard?.writeText(senha).then(() => setCopiado(true));
          }}
        >
          {copiado ? "copiada" : "copiar"}
        </button>
      </div>
    </div>
  );
}
