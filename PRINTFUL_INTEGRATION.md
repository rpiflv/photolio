# Printful Integration Guide

## Current Setup (Manual)

Your photo portfolio is set up to save orders to the database. To fulfill them:

1. **Check for new orders** in Supabase or the `/orders` page
2. **Manually create orders in Printful:**
   - Go to Printful Dashboard → Orders → Create Order
   - Select the print product matching the order
   - Upload the photo from your S3 bucket
   - Enter customer shipping info
   - Submit order

Printful will then print, pack, and ship the order.

## Automatic Integration (Optional)

To automatically create Printful orders when customers checkout:

### Step 1: Verify Photo URLs

Make sure photos are accessible via public S3 URLs. Printful needs to download them:

```typescript
// In src/routes/checkout.tsx, ensure photoUrl is the full S3 URL:
items.map(item => ({
  variant_id: item.product.variant_id,
  quantity: item.quantity,
  photo_url: item.photoUrl // Should be: https://your-bucket.s3.amazonaws.com/...
}))
```

### Step 2: Uncomment Printful Integration

In `src/routes/checkout.tsx`, uncomment the Printful integration code (lines ~107-145).

### Step 3: Import the Function

Add this import at the top of `checkout.tsx`:

```typescript
import { createPrintfulOrder } from '../api/create-printful-order'
```

### Step 4: Test with Small Orders First

- Make a test order with one inexpensive item
- Check Printful dashboard to verify it was created
- Review the draft order before confirming
- Once confirmed, Printful charges you and starts production

## Important Notes

**Costs:**
- Printful charges YOU for production + shipping
- You set the prices customers pay in `src/lib/printful.ts`
- Make sure your prices cover Printful costs + your profit margin

**Photo Requirements:**
- Minimum resolution varies by product size
- 8x10" poster: ~2400x3000px minimum
- Check Printful docs for each product

**Order Flow:**
1. Customer places order → Saved to your database
2. (Optional) Auto-create draft in Printful → Review in Printful dashboard
3. Confirm order in Printful → Printful produces and ships
4. Update order status in your database when shipped

## Webhooks (Advanced)

For automatic status updates from Printful:

1. Set up Printful webhook in your Printful dashboard
2. Create an API endpoint to receive webhook events
3. Update order status in Supabase when Printful ships

This requires a server-side endpoint (Vercel/Netlify function).

## Pricing Strategy

Current prices in `src/lib/printful.ts`:

| Product | Your Price | Printful Cost* | Your Profit |
|---------|-----------|----------------|-------------|
| 8x10" Poster | $8.95 | ~$4.99 | ~$3.96 |
| 8x10" Framed | $24.95 | ~$15.50 | ~$9.45 |
| 8x10" Canvas | $29.95 | ~$18.95 | ~$11.00 |

*Check actual Printful pricing - costs vary by location and can change.

**Don't forget:**
- Printful shipping costs (varies by location)
- Your flat $8.95 shipping fee
- Payment processing fees (Stripe ~2.9% + $0.30)

## Testing

1. **Test Mode**: Keep auto-creation commented out initially
2. **Manual Review**: Check each order before submitting to Printful
3. **Verify Costs**: Ensure prices cover your costs
4. **Quality Check**: Order a sample print to verify quality

## Support

- Printful API Docs: https://developers.printful.com/docs/
- Printful Support: help@printful.com
- Check Printful pricing calculator: https://www.printful.com/pricing
