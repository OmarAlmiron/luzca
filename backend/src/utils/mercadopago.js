import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-INVALID-TOKEN',
});

export async function createPreference({ order, items, backUrls }) {
  const preference = new Preference(client);
  const body = {
    items: items.map((it) => ({
      title: it.name,
      quantity: it.quantity,
      unit_price: it.price,
      currency_id: 'ARS',
    })),
    external_reference: order.id,
    back_urls: backUrls,
    auto_return: 'approved',
    notification_url: `${process.env.SERVER_URL || 'http://localhost:4000'}/api/payments/webhook`,
  };
  return preference.create({ body });
}

export async function getPayment(paymentId) {
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
