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

import { useAcceptBidMutation, useExpireRequestMutation, useOpenRequestMutation, useRoomSnapshotQuery } from "../../../lib/queries"
import { useRoomSocket } from "../../../lib/use-room-socket"
import { useAppState } from "../../context"
import { ProviderBidCard } from "./provider-bid-card"

export function RequestRoomPage() {
  const { requestId = "unknown" } = useParams()
  const setLastVisitedRequestId = useAppState((state) => state.setLastVisitedRequestId)
  const activeRole = useAppState((state) => state.activeRole)
  const roomQuery = useRoomSnapshotQuery(requestId)
  const acceptBid = useAcceptBidMutation(requestId)
  const expireRequest = useExpireRequestMutation(requestId)
  const openRequest = useOpenRequestMutation()

  useRoomSocket(requestId)

  const snapshot = roomQuery.data

  useEffect(() => {
    setLastVisitedRequestId(requestId)
  }, [requestId, setLastVisitedRequestId])

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This room now streams live snapshots from the Durable Object over WebSockets.
      </Alert>

      <div>
        <Typography variant="h2">Request room</Typography>
        <Typography color="text.secondary">Request ID: {requestId}</Typography>
        {snapshot && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip label={`Status: ${snapshot.status}`} color={snapshot.status === "open" ? "success" : "default"} />
            {snapshot.awardedBidId && <Chip label={`Awarded bid: ${snapshot.awardedBidId}`} />}
          </Stack>
        )}
      </div>

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Current leaderboard
            </Typography>
            <Typography color="text.secondary">
              Connected viewers: {snapshot?.connectedViewers ?? 0}
            </Typography>
            <Divider />
            {roomQuery.isLoading && <Skeleton variant="rounded" height={180} />}
            <List disablePadding>
              {snapshot?.leaderboard.map((entry, index) => (
                <ListItem key={entry.bidId} disablePadding sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={`${index + 1}. ${entry.providerDisplayName}`}
                    secondary={`ETA ${entry.availableDate}${entry.notes ? ` · ${entry.notes}` : ""}`}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                    <Typography fontWeight={700}>
                      PHP {(entry.amountCents / 100).toLocaleString()}
                    </Typography>
                    {snapshot.awardedBidId === entry.bidId && <Chip label="Accepted" color="success" />}
                    {activeRole === "patient" && snapshot.status === "open" && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={acceptBid.isPending}
                        onClick={() => acceptBid.mutate({ requestId, bidId: entry.bidId })}
                      >
                        Accept
                      </Button>
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>
            {roomQuery.isSuccess && snapshot?.leaderboard.length === 0 && (
              <Alert severity="warning">No bids in this room yet.</Alert>
            )}

            {activeRole === "patient" && snapshot?.status === "open" && (
              <Button
                variant="text"
                color="warning"
                disabled={expireRequest.isPending}
                onClick={() => expireRequest.mutate()}
              >
                {expireRequest.isPending ? "Expiring..." : "Expire request"}
              </Button>
            )}

            {activeRole === "patient" && snapshot?.status === "draft" && (
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

      {activeRole === "provider" && snapshot?.status === "open" && <ProviderBidCard requestId={requestId} />}
    </Stack>
  )
}
