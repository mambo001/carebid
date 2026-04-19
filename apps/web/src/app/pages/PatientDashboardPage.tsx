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

import { useRequestsQuery } from "../../lib/queries"
import { useAppState } from "../context"
import { PatientRequestFormCard } from "./PatientRequestFormCard"

export function PatientDashboardPage() {
  const setActiveRole = useAppState((state) => state.setActiveRole)
  const requestsQuery = useRequestsQuery()
  const requests = requestsQuery.data?.items ?? []

  return (
    <Stack spacing={3}>
      <Alert severity="info">Patient flow is scaffolded. Request creation is running through the demo API.</Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h2">Patient dashboard</Typography>
          <Typography color="text.secondary">
            Review active requests and jump into bidding rooms.
          </Typography>
        </div>

        <Button variant="contained" onClick={() => setActiveRole("patient")}>
          Use patient role
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={12}>
          <PatientRequestFormCard />
        </Grid>

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
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      {request.title}
                    </Typography>
                    <Chip label={request.status} color={request.status === "open" ? "success" : "default"} />
                  </Stack>
                  <Typography color="text.secondary">{request.category.replaceAll("_", " ")}</Typography>
                  <Typography variant="body2">
                    Target budget: PHP {(request.targetBudgetCents / 100).toLocaleString()}
                  </Typography>
                  <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined">
                    Open room
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {requestsQuery.isSuccess && requests.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning">No requests available yet.</Alert>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}
