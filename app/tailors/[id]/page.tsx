import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, CheckCircle, Scissors, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const revalidate = 0 // always fetch fresh profile data

export default async function TailorPublicProfile({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const tailorId = params.id

  // Fetch tailor basic info and profile
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", tailorId)
    .single()

  const { data: profile, error: profileErr } = await supabase
    .from("tailor_profiles")
    .select("*")
    .eq("user_id", tailorId)
    .single()

  if (userErr || profileErr || !user || !profile) {
    return notFound()
  }

  // Fetch reviews via design_requests
  // Because reviews belong to an order, and the order belongs to the tailor
  const { data: ordersWithReviews } = await supabase
    .from("design_requests")
    .select(`
      id,
      customer:users!customer_id (name),
      review:reviews!order_id (rating, comment, created_at)
    `)
    .eq("tailor_id", tailorId)
    .not("status", "in", '("draft", "pending_bids", "assigned", "paid", "in_production", "shipped", "cancelled")')
    // Basically delivered or reviewed

  // Extract flat list of reviews
  const allReviews: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    customer_name: string
  }> = []

  if (ordersWithReviews) {
    for (const order of ordersWithReviews) {
      // Supabase join array
      const revs = Array.isArray(order.review) ? order.review : (order.review ? [order.review] : [])
      for (const rev of revs) {
        if (rev) {
          // Handle Supabase returning foreign key relations as either objects or arrays
          const customerData = Array.isArray(order.customer) ? order.customer[0] : order.customer;
          const custName = customerData ? (customerData as { name?: string }).name || "Customer" : "Customer";
          
          allReviews.push({
            id: rev.created_at + order.id, // Generate a unique key for map
            rating: rev.rating,
            comment: rev.comment,
            created_at: rev.created_at,
            customer_name: custName,
          })
        }
      }
    }
  }

  // Sort newest first
  allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center px-4 md:px-8">
        <Link href="/design-studio" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm mr-auto">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </Link>
        <Link href="/">
          <span className="font-serif text-xl font-bold text-foreground">Threadify</span>
        </Link>
      </header>

      <main className="container mx-auto max-w-4xl p-6 md:p-12 space-y-12">
        {/* Profile Header */}
        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl">
            <span className="text-4xl md:text-6xl text-primary font-bold">{user.name?.charAt(0) || "T"}</span>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
                  {user.name}
                  {profile.verification_status === "approved" && (
                    <span title="Verified Tailor">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground mt-2">{profile.bio || "No biography provided."}</p>
              </div>
              <Link href="/design-studio">
                <Button className="shrink-0 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-2xl h-12 px-6">
                  Request a Quote
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground pt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-xl">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-foreground">{profile.avg_rating}</span>
                <span>({allReviews.length} Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-xl">
                <Scissors className="w-4 h-4" />
                <span>Custom Tailoring</span>
              </div>
            </div>
          </div>
        </section>

        {/* Previous Work */}
        {profile.portfolio_images && profile.portfolio_images.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">Previous Work</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.portfolio_images.map((img: string, i: number) => (
                <div key={i} className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-sm group">
                  <Image
                    src={img}
                    alt={`${user.name} portfolio item ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold">Client Reviews</h2>
            <span className="text-sm font-semibold text-muted-foreground">{allReviews.length} reviews total</span>
          </div>
          
          {allReviews.length === 0 ? (
            <div className="bg-muted/50 border border-border rounded-3xl p-8 text-center text-muted-foreground">
              No reviews yet. Be the first to order!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allReviews.map((rev) => (
                <div key={rev.id} className="bg-card border border-border p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{rev.customer_name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(rev.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-muted text-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                      &quot;{rev.comment}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
