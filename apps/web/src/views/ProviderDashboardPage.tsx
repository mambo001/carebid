import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

import { useAppStore } from "../store/app-store"

const providerQueue = [
  {
    id: "req-neuro-001",
    title: "Neurology second opinion",
    category: "specialist_consult",
    city: "Makati",
    urgency: "soon",
  },
  {
    id: "req-imaging-003",
    title: "CT quote for chest imaging",
    category: "imaging",
    city: "Taguig",
    urgency: "urgent",
  },
] as const

export function ProviderDashboardPage() {
  const setActiveRole = useAppStore((state) => state.setActiveRole)

  return (
    <Stack spacing={3}>
      <Alert severity="info">Provider filtering is scaffolded. Eligibility and bidding come next.</Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4" fontWeight={800}>
            Provider dashboard
          </Typography>
          <Typography color="text.secondary">
            Review eligible requests and join the live bidding room.
          </Typography>
        </div>

        <Button variant="contained" onClick={() => setActiveRole("provider")}>
          Use provider role
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {providerQueue.map((request) => (
          <Grid key={request.id} size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                      {request.title}
                    </Typography>
                    <Chip label={request.urgency} color={request.urgency === "urgent" ? "error" : "default"} />
                  </Stack>
                  <Typography color="text.secondary">
                    {request.category.replaceAll("_", " ")} · {request.city}
                  </Typography>
                  <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined">
                    Join room
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
