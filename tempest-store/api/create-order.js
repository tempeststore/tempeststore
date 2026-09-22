// FILE 2: api/create-order.js (Vercel Serverless Function)
// Place this in a folder called "api" at the root of your project

export const config = {
  runtime: 'edge'
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, items, total, profit } = req.body;

    console.log('🔥 New Order Received:', { customer, items, total, profit });

    // Validate required fields
    if (!customer || !items || !customer.email || !customer.address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // CJdropshipping API Configuration
    const CJ_API_TOKEN = process.env.CJ_API_TOKEN;
    const CJ_API_BASE = 'https://api.cjdropshipping.com/api/v2';

    if (!CJ_API_TOKEN) {
      console.error('❌ CJ_API_TOKEN not configured in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create orders in CJdropshipping
    const cjOrders = [];
    
    for (const item of items) {
      const cjOrderData = {
        product_id: item.cjProductId,
        sku: item.sku,
        quantity: item.quantity || 1,
        shipping_method: 'CJPacket Ordinary',
        recipient: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '+1234567890',
          address1: customer.address.street,
          address2: customer.address.apartment || '',
          city: customer.address.city,
          state: customer.address.state || '',
          zip: customer.address.postalCode,
          country: customer.address.country
        }
      };

      console.log('📦 Creating CJ Order for SKU:', item.sku);

      // Call CJdropshipping API
      const cjResponse = await fetch(`${CJ_API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': CJ_API_TOKEN
        },
        body: JSON.stringify({
          orders: [cjOrderData]
        })
      });

      const cjResult = await cjResponse.json();
      console.log('CJ API Response:', cjResult);

      if (cjResult.code === 200 || cjResult.code === 0) {
        cjOrders.push({
          sku: item.sku,
          cjOrderId: cjResult.data?.orders?.[0]?.order_id || 'pending',
          status: 'created'
        });
      } else {
        console.error('❌ CJ API Error:', cjResult);
        cjOrders.push({
          sku: item.sku,
          error: cjResult.message || 'Unknown error',
          status: 'failed'
        });
      }
    }

    const orderSummary = {
      orderId: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customer,
      items: cjOrders,
      total,
      profit,
      status: 'processing'
    };

    console.log('✅ Order Summary:', orderSummary);

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      orderId: orderSummary.orderId,
      cjOrders: cjOrders,
      total,
      estimatedDelivery: '7-15 business days'
    });

  } catch (error) {
    console.error('❌ Order Creation Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
}