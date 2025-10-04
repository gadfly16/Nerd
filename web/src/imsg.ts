// Interface Message Types - Must match internal/imsg/imsg.go

enum Type {
  GetTree = 0,
  CreateChild,
  RenameChild,
  Shutdown,
  AuthenticateUser,
  CreateUser,
}

async function ask(type: Type, pl: any): Promise<any> {
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

export default {
  Type,
  ask,
}
