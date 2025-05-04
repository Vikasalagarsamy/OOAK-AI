import type { Metadata } from "next"
import { UserProfile } from "@/components/user-profile"

export const metadata: Metadata = {
  title: "Profile",
  description: "Your user profile",
}

export default function ProfilePage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>
      <UserProfile />
    </div>
  )
}
