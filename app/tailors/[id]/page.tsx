import { redirect } from "next/navigation"

export default function TailorPublicProfileRedirect({ params }: { params: { id: string } }) {
  redirect(`/tailor/${params.id}`)
}

