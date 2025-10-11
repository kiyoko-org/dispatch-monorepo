import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'

export const Route = createFileRoute('/(auth)/signup')({
	component: RouteComponent,
})

function RouteComponent() {
	const signupSchema = z.object({
		firstName: z.string().max(50),
		lastName: z.string().max(50),
		suffix: z.string().max(10).optional(),
		middleName: z.string().max(50).optional(),
		address: z.string().max(100),
		birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
			message: 'Invalid date format',
		}),
		email: z.string().email(),
		password: z.string().min(6, 'Password must be atlease 6 characters long'),
	})

	const signupForm = useForm({
		defaultValues: {
			firstName: '',
			middleName: '',
			lastName: '',
			suffix: '',
			address: '',
			birthDate: '',
			email: '',
			password: '',
		},
		validators: {
			onSubmit: signupSchema,
		},
		onSubmit: async ({ value }) => {
			console.info('You submitted: ', value)
		},
	})

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader>
						<CardTitle>Create an account</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={(e) => {
								e.preventDefault()
								signupForm.handleSubmit()
							}}
						>
							<FieldGroup>
								<signupForm.Field
									name="firstName"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>First name</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="First name"
													autoComplete="given-name"
													required
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="middleName"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Middle name</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Middle name (optional)"
													autoComplete="additional-name"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="lastName"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Last name</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Last name"
													autoComplete="family-name"
													required
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="suffix"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Suffix</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Jr., Sr., III (optional)"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="address"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Address</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Street address"
													autoComplete="street-address"
													required
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="birthDate"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Birth date</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													type="date"
													placeholder="YYYY-MM-DD"
													required
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="email"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Email</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="m@example.com"
													autoComplete="email"
													required
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<signupForm.Field
									name="password"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid

										return (
											<Field data-invalid={isInvalid}>
												<Label htmlFor={field.name}>Password</Label>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="Password"
													type="password"
													autoComplete="new-password"
													required
												></Input>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								/>

								<Field>
									<Button type="submit">Sign up</Button>
								</Field>
							</FieldGroup>
						</form>
					</CardContent>
					<CardFooter>
						Already have an account?{' '}
						<a href="/login" className="text-blue-500 hover:underline">
							&nbsp;Login
						</a>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}
