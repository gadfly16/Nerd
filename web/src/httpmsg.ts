// HTTP Message Types - Must match internal/httpmsg/httpmsg.go
export enum httpMsg {
  GetTree = 0,
  CreateChild,
  RenameChild,
  Shutdown,
  AuthenticateUser,
  CreateUser,
}
