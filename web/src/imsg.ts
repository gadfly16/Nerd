// Interface Message Types
// Must match internal/imsg/imsg.go

export enum imsg {
  GetTree = 0,
  Lookup,
  CreateChild,
  RenameChild,
  DeleteChild,
  Shutdown,
  AuthenticateUser,
  Logout,
  Subscribe,
  Unsubscribe,
}
