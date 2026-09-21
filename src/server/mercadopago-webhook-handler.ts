import { verifyMercadoPagoSignature } from "./mercadopago-webhook";

export type MercadoPagoWebhookResult = {
  verified: boolean;
  providerEventId: string | null;
  eventType: string | null;
  dataId: string | null;
};

/**
 * Framework-agnostic webhook parser.
 * The HTTP route must pass the raw body and the relevant headers.
 * Payment state must only be changed after verification and provider lookup.
 */
export async function parseMercadoPagoWebhook(
  rawBody: string,
  headers: {
    xSignature?: string | null;
    xRequestId?: string | null;
  },
): Promise<MercadoPagoWebhookResult> {
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { verified: false, providerEventId: null, eventType: null, dataId: null };
  }

  const dataId =
    payload?.data?.id != null ? String(payload.data.id) : null;

  if (!dataId || !headers.xRequestId) {
    return {
      verified: false,
      providerEventId: payload?.id != null ? String(payload.id) : null,
      eventType: payload?.type ?? payload?.action ?? null,
      dataId,
    };
  }

  const verified = await verifyMercadoPagoSignature(
    headers.xSignature ?? null,
    dataId,
    headers.xRequestId,
  );

  return {
    verified,
    providerEventId: payload?.id != null ? String(payload.id) : null,
    eventType: payload?.type ?? payload?.action ?? null,
    dataId,
  };
}
