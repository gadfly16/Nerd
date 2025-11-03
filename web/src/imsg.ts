// Interface Message Types
// Must match internal/imsg/imsg.go

export enum imsg {
  IGetTree = 0,
  ILookup,
  ICreateChild,
  IRenameChild,
  IDeleteChild,
  IShutdown,

  IAuthenticateUser,
  ILogout,

  INodeSubscribe,
  INodeUnsubscribe,
  ITopoUpdate,
  INodeUpdate,

  IGetState,
}
