export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { customer, items, total } = request.body ?? {};

    if (
      !customer?.name ||
      !customer?.email ||
      !customer?.address?.street ||
      !customer?.address?.city ||
      !customer?.address?.postalCode ||
      !customer?.address?.country ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return response.status(400).json({
        success: false,
        error: "Missing customer, address, or item data"
      });
    }

    const cjApiToken = process.env.CJ_API_TOKEN;

    if (!cjApiToken) {
      console.error("CJ_API_TOKEN is not configured");
      return response.status(500).json({
        success: false,
        error: "Store configuration error"
      });
    }

    /*
      Important:
      Do not submit actual fulfilment orders until payment has succeeded.
      This endpoint currently validates the request and is the location
      for the CJ API call after you add Stripe Checkout/webhook validation.
    */

    console.log("Received proposed order", {
      customerEmail: customer.email,
      itemCount: items.length,
      total
    });

    return response.status(200).json({
      success: true,
      orderId: `TMP-${Date.now()}`,
      message: "Order received for processing",
      estimatedDelivery: "7–15 business days"
    });
  } catch (error) {
    console.error("Order endpoint error:", error);

    return response.status(500).json({
      success: false,
      error: "Unable to process the order"
    });
  }
}
