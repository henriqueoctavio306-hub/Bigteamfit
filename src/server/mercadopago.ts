export type CheckoutInput = {
  externalReference: string;
  title: string;
  amount: number;
  currency: "BRL";
  payerEmail?: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
};

export type CheckoutResult = {
  provider: "mercadopago";
  providerOrderId: string;
  checkoutUrl: string;
};

const MP_API = "https://api.mercadopago.com";

export async function createMercadoPagoCheckout(
  input: CheckoutInput,
  accessToken = process.env["MERCADOPAGO_ACCESS_TOKEN"],
): Promise<CheckoutResult> {
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  }

  const idempotencyKey = crypto.randomUUID();

  const response = await fetch(`${MP_API}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      type: "online",
      external_reference: input.externalReference,
      total_amount: input.amount.toFixed(2),
      currency: input.currency,
      title: input.title,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: input.backUrls,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago order creation failed (${response.status}): ${body}`);
  }

  const data = await response.json();

  if (!data.id || !data.checkout_url) {
    throw new Error("Mercado Pago returned an incomplete checkout response");
  }

  return {
    provider: "mercadopago",
    providerOrderId: String(data.id),
    checkoutUrl: data.checkout_url,
  };
}
