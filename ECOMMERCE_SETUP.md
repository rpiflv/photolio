# E-Commerce Setup Guide

This guide will help you set up the e-commerce functionality using Printful for print-on-demand fulfillment.

## 1. Create a Printful Account

1. Go to [https://www.printful.com](https://www.printful.com)
2. Sign up for a free account
3. Complete your store setup

## 2. Get Your Printful API Key

1. Log into your Printful dashboard
2. Go to **Settings** → **Stores**
3. Click on **Add Store** → **Manual order platform / API**
4. Give your store a name (e.g., "PhotoFolio API")
5. Click **Continue**
6. Copy your **API Key** from the settings page

## 3. Configure Environment Variables

Add the following to your `.env` file:

```env
VITE_PRINTFUL_API_KEY=your-printful-api-key-here
```

## 4. Set Up Supabase Orders Table

Run the migration SQL in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-orders-migration.sql`
4. Copy and paste the contents into the SQL editor
5. Click **Run** to create the orders table

## 5. How It Works

### Customer Flow:
1. Customer browses the gallery
2. Clicks "Buy Print" on a photo
3. Selects print size and format (poster, framed, canvas)
4. Adds to cart
5. Proceeds to checkout
6. Enters shipping information
7. Places order

### Order Processing:
- Orders are saved to the Supabase `orders` table
- Order details include customer info, items, and shipping address
- Status starts as "pending"

### Manual Printful Integration (Current):
Since this is a demo, you'll need to manually create orders in Printful:

1. Check new orders in your Supabase database
2. Go to Printful dashboard → **Orders**
3. Click **Create Order**
4. Add the print products matching the order
5. Upload the photo from your S3 bucket
6. Enter customer shipping information
7. Submit the order

Printful will then:
- Print the photo
- Package it
- Ship it to the customer
- Provide tracking information

## 6. Product Pricing

Current print products and pricing (configured in `src/lib/printful.ts`):

**Posters:**
- 8x10" - $8.95
- 12x16" - $14.95
- 18x24" - $24.95

**Framed Prints:**
- 8x10" - $24.95
- 12x16" - $34.95
- 18x24" - $49.95

**Canvas Prints:**
- 8x10" - $29.95
- 12x16" - $39.95
- 18x24" - $59.95

Shipping: $8.95 flat rate

## 7. Future Enhancements

To fully automate the process, you can:

1. **Implement Stripe Payment Processing:**
   - Add payment collection before order creation
   - Verify payment before submitting to Printful

2. **Automate Printful Order Creation:**
   - Use the Printful API to automatically create orders
   - Upload photos from S3 URLs
   - Automatically send orders to production

3. **Add Order Management Dashboard:**
   - View all orders
   - Update order status
   - Track shipments
   - Handle customer service

4. **Email Notifications:**
   - Order confirmation emails
   - Shipping notifications
   - Delivery confirmations

## 8. Testing

To test the e-commerce flow:

1. Start your development server: `npm run dev`
2. Browse the gallery
3. Click "Buy Print" on any photo
4. Select a product and add to cart
5. View your cart
6. Proceed to checkout
7. Fill in shipping information (use test data)
8. Submit the order
9. Check Supabase for the order record

## Important Notes

- **This is currently a demo setup** - no real payments are processed
- Orders are saved to the database but not automatically sent to Printful
- You'll need to manually fulfill orders through Printful's dashboard
- Make sure your photos are high-resolution for print quality
- Printful has minimum image resolution requirements for each product size

## Support

For Printful questions:
- [Printful Help Center](https://help.printful.com)
- [Printful API Documentation](https://developers.printful.com/docs)

For implementation questions:
- Check the code comments in `src/lib/printful.ts`
- Review the cart store in `src/stores/cartStore.ts`
- Examine the checkout flow in `src/routes/checkout.tsx`
