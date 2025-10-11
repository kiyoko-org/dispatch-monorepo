import { dispatch } from '@/lib/dispatch'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: App,
	beforeLoad: async () => {
		const response = await dispatch.getSafeSession()

		if (response.error) {
			console.error('Error fetching session:', response.error)
		}

		if (!response.user) {
			throw redirect({
				to: '/login',
			})
		}
	}
})

function App() {
}
