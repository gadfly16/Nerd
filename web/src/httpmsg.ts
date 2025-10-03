// HTTP Message Types - Must match internal/httpmsg/httpmsg.go
export enum HttpMsgType {
  HttpGetTree = 0,
  HttpCreateChild,
  HttpRenameChild,
  HttpShutdown,
  HttpAuthenticateUser,
  HttpCreateUser,
}
