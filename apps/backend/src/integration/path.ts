import { RequestId } from "../data/branded"

export const parseRequestIdFromPath = (pathname: string): RequestId => {
  const parts = pathname.split("/")
  // pathname format: /api/requests/:id/...
  return parts[3] as RequestId
}
