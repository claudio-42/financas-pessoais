import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const headersFor = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && (origin === allowedOrigin || origin.startsWith("http://127.0.0.1:")) ? origin : allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Vary": "Origin",
});

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = headersFor(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método inválido" }), { status: 405, headers: cors });
  if (!origin || (!origin.startsWith("http://127.0.0.1:") && origin !== allowedOrigin)) return new Response(JSON.stringify({ error: "Origem não autorizada" }), { status: 403, headers: cors });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401, headers: cors });

  if (user.id !== "241150e0-ff57-477c-8b35-6787982f0772") return new Response(JSON.stringify({ error: "Acesso não autorizado" }), { status: 403, headers: cors });

  const clientId = Deno.env.get("PLUGGY_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET")?.trim();
  const itemId = Deno.env.get("PLUGGY_ITEM_ID")?.trim();
  if (!clientId || !clientSecret || !itemId) return new Response(JSON.stringify({ error: "Pluggy ainda não configurado" }), { status: 503, headers: cors });

  try {
    const authResponse = await fetch("https://api.pluggy.ai/auth", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!authResponse.ok) throw new Error("Falha ao autenticar na Pluggy");
    const { apiKey } = await authResponse.json();
    const pluggyHeaders = { "X-API-KEY": apiKey };
    const itemResponse = await fetch(`https://api.pluggy.ai/items/${encodeURIComponent(itemId)}`, { headers: pluggyHeaders });
    if (!itemResponse.ok) {
      const itemError = await itemResponse.json().catch(() => ({}));
      console.error("Pluggy item rejected", JSON.stringify({ status: itemResponse.status, code: itemError?.code, message: itemError?.message }));
      return new Response(JSON.stringify({
        synced: 0,
        warning: `A Pluggy recusou o Item ID (HTTP ${itemResponse.status}${itemError?.code ? ` — ${itemError.code}` : ""}).`,
      }), { headers: cors });
    }
    const item = await itemResponse.json();
    const accountsResponse = await fetch(`https://api.pluggy.ai/accounts?itemId=${encodeURIComponent(itemId)}`, { headers: pluggyHeaders });
    if (!accountsResponse.ok) throw new Error("Falha ao carregar as contas");
    const accountsBody = await accountsResponse.json();
    const accounts = accountsBody.results ?? accountsBody;
    console.info("Pluggy accounts", JSON.stringify({ count: accounts.length }));
    if (!accounts.length) return new Response(JSON.stringify({
      synced: 0,
      warning: `A Pluggy reconheceu o item, mas não encontrou contas. Estado: ${item.status ?? "desconhecido"} / ${item.executionStatus ?? "desconhecido"}.`,
    }), { headers: cors });
    const records: Record<string, unknown>[] = [];

    for (const account of accounts) {
      let next = `?accountId=${encodeURIComponent(account.id)}`;
      while (next) {
        const response = await fetch(`https://api.pluggy.ai/v2/transactions${next}`, { headers: pluggyHeaders });
        if (!response.ok) throw new Error("Falha ao carregar movimentações");
        const page = await response.json();
        console.info("Pluggy transactions", JSON.stringify({ count: page.results?.length, fields: Object.keys(page) }));
        for (const transaction of page.results ?? []) records.push({
          id: transaction.id,
          user_id: user.id,
          item_id: itemId,
          account_id: account.id,
          description: transaction.description || "Movimentação",
          category: transaction.category || transaction.merchant?.category || "Outros",
          amount: transaction.amount,
          transaction_date: String(transaction.date).slice(0, 10),
          status: transaction.status,
          raw: transaction,
          synced_at: new Date().toISOString(),
        });
        next = page.next || "";
      }
    }

    if (records.length) {
      const { error } = await authClient.from("transactions").upsert(records, { onConflict: "user_id,id" });
      if (error) throw error;
    }
    return new Response(JSON.stringify({
      synced: records.length,
      warning: records.length ? null : `A Pluggy encontrou ${accounts.length} conta(s), mas nenhuma movimentação. Estado: ${item.status ?? "desconhecido"} / ${item.executionStatus ?? "desconhecido"}.`,
    }), { headers: cors });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Não foi possível sincronizar agora" }), { status: 502, headers: cors });
  }
});
