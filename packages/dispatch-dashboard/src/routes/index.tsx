"use client"

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { useAuthContext } from "@/auth/AuthProvider"
import { dispatch } from "@/lib/supabase"

export const Route = createFileRoute("/")({
	beforeLoad: async ({ location }) => {
		const { data } = await dispatch.auth.getSession()
		if (!data.session) {
			throw redirect({ to: "/login", search: { redirect: location.href } })
		}
	},
	component: DispatchDashboard
})


export default function DispatchDashboard() {
	const { user: authUser, signOut } = useAuthContext()

	const displayName = (() => {
		const meta = (authUser as any)?.user_metadata || {}
		const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ")
		return name || meta.badgenumber || authUser?.email || "Profile"
	})()

	return (
		<div className="min-h-screen bg-background p-6">
			{displayName}
		</div>
	)
}
