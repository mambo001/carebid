import {
  Alert,
  Card,
  CardContent,
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

import { useRoomSnapshotQuery } from "../lib/queries"
import { useRoomSocket } from "../lib/use-room-socket"
import { useAppStore } from "../store/app-store"
import { ProviderBidCard } from "./ProviderBidCard"

export function RequestRoomPage() {
  const { requestId = "unknown" } = useParams()
  const setLastVisitedRequestId = useAppStore((state) => state.setLastVisitedRequestId)
  const activeRole = useAppStore((state) => state.activeRole)
  const roomQuery = useRoomSnapshotQuery(requestId)

  useRoomSocket(requestId)

  useEffect(() => {
    setLastVisitedRequestId(requestId)
  }, [requestId, setLastVisitedRequestId])

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This room now streams live snapshots from the Durable Object over WebSockets.
      </Alert>

      <div>
        <Typography variant="h4" fontWeight={800}>
          Request room
        </Typography>
        <Typography color="text.secondary">Request ID: {requestId}</Typography>
      </div>

      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Current leaderboard
            </Typography>
            <Typography color="text.secondary">
              Connected viewers: {roomQuery.data?.connectedViewers ?? 0}
            </Typography>
            <Divider />
            {roomQuery.isLoading && <Skeleton variant="rounded" height={180} />}
            <List disablePadding>
              {roomQuery.data?.leaderboard.map((entry, index) => (
                <ListItem key={entry.bidId} disablePadding sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={`${index + 1}. ${entry.providerDisplayName}`}
                    secondary={`ETA ${entry.availableDate}`}
                  />
                  <Typography fontWeight={700}>
                    PHP {(entry.amountCents / 100).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
            {roomQuery.isSuccess && roomQuery.data.leaderboard.length === 0 && (
              <Alert severity="warning">No bids in this room yet.</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {activeRole === "provider" && <ProviderBidCard requestId={requestId} />}
    </Stack>
  )
}
