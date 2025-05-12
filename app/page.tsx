import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to dashboard on the home page
  redirect("/dashboard")
}
