import {
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { useEffect } from "react"
import { useParams } from "react-router-dom"

import { useAppStore } from "../store/app-store"

const leaderboard = [
  { label: "Bid 1", amount: "$14,000", eta: "2026-04-24" },
  { label: "Bid 2", amount: "$15,500", eta: "2026-04-26" },
  { label: "Bid 3", amount: "$17,000", eta: "2026-04-27" },
]

export function RequestRoomPage() {
  const { requestId = "unknown" } = useParams()
  const setLastVisitedRequestId = useAppStore((state) => state.setLastVisitedRequestId)

  useEffect(() => {
    setLastVisitedRequestId(requestId)
  }, [requestId, setLastVisitedRequestId])

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This room is scaffolded for the Durable Object flow. Live websocket bidding comes next.
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
            <Divider />
            <List disablePadding>
              {leaderboard.map((entry) => (
                <ListItem key={entry.label} disablePadding sx={{ py: 1.5 }}>
                  <ListItemText primary={entry.label} secondary={`ETA ${entry.eta}`} />
                  <Typography fontWeight={700}>{entry.amount}</Typography>
                </ListItem>
              ))}
            </List>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
