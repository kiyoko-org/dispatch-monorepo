import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthContext } from 'dispatch-lib'
import { dispatch } from '@/lib/dispatch'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  dispatch

  const { user, isLoading, signOut } = useAuthContext()

  const navigate = useNavigate()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return redirect({ to: '/login' })
  }

  return (
    <div>
      <h1>Welcome, {user.user_metadata.name}!</h1>
      {/* Rest of the app */}
      <button
        onClick={() => {
          signOut()

          navigate({ to: '/login' })
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
