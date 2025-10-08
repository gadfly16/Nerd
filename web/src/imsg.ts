// Interface Message Types and Functions
// Must match internal/imsg/imsg.go

// Interface Message Types enum
export enum imsg {
	GetTree = 0,
	CreateChild,
	RenameChild,
	Shutdown,
	AuthenticateUser,
	CreateUser,
	Logout,
}

// Ask sends an API message to the server and returns the response payload
// Throws on HTTP errors or network failures
export async function Ask(
	type: imsg,
	targetId: number,
	pl: any = {},
): Promise<any> {
	const response = await fetch("/api", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type, targetId, payload: pl }),
	})

	if (!response.ok) {
		throw new Error((await response.text()) || "Request failed")
	}

	return await response.json()
}

// AskAuth sends an authentication message to the server
// Used for login, registration, and logout
export async function AskAuth(type: imsg, pl: any): Promise<any> {
	const response = await fetch("/auth", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type, payload: pl }),
	})

	if (!response.ok) {
		throw new Error((await response.text()) || "Request failed")
	}

	return await response.json()
}
