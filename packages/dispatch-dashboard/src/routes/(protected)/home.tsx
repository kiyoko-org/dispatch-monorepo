import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/home')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(protected)/home"!</div>
}
