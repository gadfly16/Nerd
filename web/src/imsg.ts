// Interface Message Types - Must match internal/imsg/imsg.go
export enum imsg {
  GetTree = 0,
  CreateChild,
  RenameChild,
  Shutdown,
  AuthenticateUser,
  CreateUser,
}
