import React from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

import { useOpenRequestsQuery } from "../../../lib/queries"
import { useAppState } from "../../context"

export function ProviderDashboardPage() {
  const setActiveRole = useAppState((state) => state.setActiveRole)
  const requestsQuery = useOpenRequestsQuery()
  const requests = requestsQuery.data?.items ?? []

  return (
    <Stack spacing={3}>
      <Alert severity="info">Provider filtering is scaffolded. Bidding happens in real-time via server-sent events.</Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h2">Provider dashboard</Typography>
          <Typography color="text.secondary">
            Review eligible requests and join the live bidding room.
          </Typography>
        </div>

        <Button variant="contained" onClick={() => setActiveRole("provider")}>
          Use provider role
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {requestsQuery.isLoading &&
          [0, 1].map((item) => (
            <Grid key={item} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))}

        {requests.map((request) => (
          <Grid key={request.id} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                      {request.title}
                    </Typography>
                    <Chip label="open" color="success" />
                  </Stack>
                  <Typography color="text.secondary">
                    {request.category.replaceAll("_", " ")}
                  </Typography>
                  <Typography variant="body2">{request.description}</Typography>
                  <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined">
                    Join room
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {requestsQuery.isSuccess && requests.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning">No eligible requests available yet.</Alert>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}
