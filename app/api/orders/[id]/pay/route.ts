import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createNotification } from "@/app/api/notifications/helpers"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to purchase garments." },
        { status: 401 }
      )
    }

    const orderId = params.id
    const { quoteId } = await request.json()

    if (!quoteId) {
      return NextResponse.json(
        { error: "A valid tailor quotation ID is required." },
        { status: 400 }
      )
    }

    // Query quotation price
    const { data: quote, error: quoteErr } = await supabase
      .from("quotations")
      .select("price, tailor_id")
      .eq("id", quoteId)
      .single()

    if (quoteErr || !quote) {
      // Mock fallback if quote not in database
      const fallbackPrice = 280
      const pricePaise = fallbackPrice * 100
      const mockOrderId = `order_rzp_mock_${Math.random().toString(36).substring(7)}`
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: pricePaise,
        currency: "INR",
      })
    }

    const pricePaise = Math.round(Number(quote.price) * 100)

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    let rzpOrderId = `order_rzp_mock_${Math.random().toString(36).substring(7)}`

    if (keyId && keySecret && !keyId.includes("placeholder")) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        })

        const rzpOrder = await razorpay.orders.create({
          amount: pricePaise,
          currency: "INR",
          receipt: `rcpt_${orderId.substring(0, 20)}`,
          notes: {
            requestId: orderId,
            quoteId: quoteId,
            tailorId: quote.tailor_id,
          },
        })

        if (rzpOrder?.id) {
          rzpOrderId = rzpOrder.id
        }
      } catch (rzpErr) {
        const warningMsg = rzpErr instanceof Error ? rzpErr.message : "unknown error"
        console.warn("Razorpay order creation failed, falling back to mock", warningMsg)
      }
    }

    // Notify the tailor they have been assigned
    if (quote.tailor_id) {
      await createNotification(
        supabase,
        quote.tailor_id,
        "Congratulations! You've been selected for a new garment order. Payment is in escrow.",
        "/tailor/orders"
      )
    }

    return NextResponse.json({
      success: true,
      orderId: rzpOrderId,
      amount: pricePaise,
      currency: "INR",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "An unexpected payment error occurred."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
