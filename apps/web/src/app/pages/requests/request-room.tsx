import React from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import { useEffect } from "react"
import { useParams } from "react-router-dom"

import { useAcceptBidMutation, useOpenRequestMutation, useRoomSnapshotQuery } from "../../../lib/queries"
import { useRoomSocket } from "../../../lib/use-room-socket"
import { useAppState } from "../../context"
import { ProviderBidCard } from "./provider-bid-card"

const requestStatus = (tag: string) => tag.replace("Request", "").toLowerCase()

export function RequestRoomPage() {
  const { requestId = "unknown" } = useParams()
  const setLastVisitedRequestId = useAppState((state) => state.setLastVisitedRequestId)
  const activeRole = useAppState((state) => state.activeRole)
  const roomQuery = useRoomSnapshotQuery(requestId)
  const acceptBid = useAcceptBidMutation(requestId)
  const openRequest = useOpenRequestMutation()

  useRoomSocket(requestId)

  const request = roomQuery.data?.request
  const bids = request?._tag === "OpenRequest" || request?._tag === "AwardedRequest" ? request.bids : []
  const status = request ? requestStatus(request._tag) : undefined

  useEffect(() => {
    setLastVisitedRequestId(requestId)
  }, [requestId, setLastVisitedRequestId])

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This room streams live snapshots from the backend over server-sent events.
      </Alert>

      <div>
        <Typography variant="h2">Request room</Typography>
        <Typography color="text.secondary">Request ID: {requestId}</Typography>
        {request && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip label={`Status: ${status}`} color={request._tag === "OpenRequest" ? "success" : "default"} />
            {request._tag === "AwardedRequest" && <Chip label={`Awarded bid: ${request.awardedBidId}`} />}
          </Stack>
        )}
      </div>

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Current leaderboard
            </Typography>
            {request && <Typography color="text.secondary">{request.title}</Typography>}
            <Divider />
            {roomQuery.isLoading && <Skeleton variant="rounded" height={180} />}
            <List disablePadding>
              {bids.map((entry, index) => (
                <ListItem key={entry.id} disablePadding sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={`${index + 1}. ${entry.providerDisplayName}`}
                    secondary={`ETA ${entry.availableDate}${entry.notes ? ` · ${entry.notes}` : ""}`}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                    <Typography fontWeight={700}>
                      PHP {(entry.amount / 100).toLocaleString()}
                    </Typography>
                    {request?._tag === "AwardedRequest" && request.awardedBidId === entry.id && <Chip label="Accepted" color="success" />}
                    {activeRole === "patient" && request?._tag === "OpenRequest" && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={acceptBid.isPending}
                        onClick={() => acceptBid.mutate({ bidId: entry.id })}
                      >
                        Accept
                      </Button>
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>
            {roomQuery.isSuccess && bids.length === 0 && (
              <Alert severity="warning">No bids in this room yet.</Alert>
            )}

            {activeRole === "patient" && request?._tag === "DraftRequest" && (
              <Button
                variant="contained"
                disabled={openRequest.isPending}
                onClick={() => openRequest.mutate(requestId)}
              >
                {openRequest.isPending ? "Opening..." : "Open request for bidding"}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {activeRole === "provider" && request?._tag === "OpenRequest" && <ProviderBidCard requestId={requestId} />}
    </Stack>
  )
}
