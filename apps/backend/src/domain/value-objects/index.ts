import { Brand } from "effect"

export type RequestId = string & Brand.Brand<"RequestId">
export const RequestId = Brand.nominal<RequestId>()

export type PatientId = string & Brand.Brand<"PatientId">
export const PatientId = Brand.nominal<PatientId>()

export type ProviderId = string & Brand.Brand<"ProviderId">
export const ProviderId = Brand.nominal<ProviderId>()

export type BidId = string & Brand.Brand<"BidId">
export const BidId = Brand.nominal<BidId>()

export type AuthUserId = string & Brand.Brand<"AuthUserId">
export const AuthUserId = Brand.nominal<AuthUserId>()
