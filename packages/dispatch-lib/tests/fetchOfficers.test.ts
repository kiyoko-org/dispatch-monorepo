import { beforeAll, beforeEach, describe, expect, it, mock, vi } from "bun:test"
import type { Database } from "../database.types"

const createClientMock = vi.fn()

mock.module("@supabase/supabase-js", () => ({
	createClient: createClientMock,
}))

let DispatchClientClass: typeof import("../index.ts").DispatchClient
let getDispatchClientFn: typeof import("../index.ts").getDispatchClient
let initDispatchClientFn: typeof import("../index.ts").initDispatchClient

beforeAll(async () => {
	const module = await import("../index.ts")
	DispatchClientClass = module.DispatchClient
	getDispatchClientFn = module.getDispatchClient
	initDispatchClientFn = module.initDispatchClient
})

describe("DispatchClient.fetchOfficers", () => {
	let fromMock: ReturnType<typeof vi.fn>
	let selectMock: ReturnType<typeof vi.fn>
	let eqMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		createClientMock.mockReset()
		fromMock = vi.fn()
		selectMock = vi.fn()
		eqMock = vi.fn()

		const authMock = {
			onAuthStateChange: vi.fn(),
			getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
			getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
			signInWithPassword: vi.fn(),
		}

		createClientMock.mockReturnValue({
			from: fromMock,
			auth: authMock,
		})

		fromMock.mockReturnValue({ select: selectMock })
		selectMock.mockReturnValue({ eq: eqMock })

		eqMock.mockResolvedValue({ data: [], error: null })

		;(DispatchClientClass as unknown as { _instance: null | object })._instance = null
	})

	it("returns a non-empty list of officers", async () => {
		const mockOfficers: Database["public"]["Tables"]["profiles"]["Row"][] = [
			{
				id: "officer-1",
				role: "officer",
				avatar_url: null,
				badge_number: "12345",
				first_name: "Jane",
				last_name: "Doe",
				middle_name: null,
				updated_at: "2025-01-01T00:00:00Z",
			},
		]

		eqMock.mockResolvedValueOnce({ data: mockOfficers, error: null })

		initDispatchClientFn({
			supabaseClientConfig: {
				url: "https://example.local",
				anonymousKey: "anon",
			},
		})

		const client = getDispatchClientFn()
		const result = await client.fetchOfficers()

		expect(fromMock).toHaveBeenCalledWith("profiles")
		expect(selectMock).toHaveBeenCalledWith("*")
		expect(eqMock).toHaveBeenCalledWith("role", "officer")
		expect(result.error).toBeNull()
		expect(result.data).not.toBeNull()
		expect(Array.isArray(result.data)).toBe(true)
		expect(result.data?.length ?? 0).toBeGreaterThan(0)
	})
})
