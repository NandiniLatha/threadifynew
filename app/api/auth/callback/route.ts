import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const oauthError = searchParams.get("error")
  const oauthErrorDesc = searchParams.get("error_description")

  // Handle OAuth provider errors (e.g. user denied access)
  if (oauthError) {
    const msg = oauthErrorDesc ? encodeURIComponent(oauthErrorDesc) : "oauth-denied"
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Retry profile lookup — handles race condition where DB trigger hasn't run yet
      let role: string | undefined
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
        if (profile?.role) {
          role = profile.role
          break
        }
        // Wait 500ms between retries
        await new Promise(res => setTimeout(res, 500))
      }

      if (role === "tailor") {
        return NextResponse.redirect(`${origin}/tailor/requests`)
      } else if (role === "admin") {
        return NextResponse.redirect(`${origin}/admin`)
      } else {
        // Default: customer dashboard (also covers missing profile)
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
