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

const demoRequests = [
  {
    id: "req-neuro-001",
    title: "Neurology second opinion",
    category: "specialist_consult",
    budget: "$18,000",
    status: "open",
  },
  {
    id: "req-imaging-002",
    title: "MRI quote for lower back",
    category: "imaging",
    budget: "$9,500",
    status: "draft",
  },
] as const

export function PatientDashboardPage() {
  const setActiveRole = useAppStore((state) => state.setActiveRole)

  return (
    <Stack spacing={3}>
      <Alert severity="info">Patient flow is scaffolded. Request creation comes next.</Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4" fontWeight={800}>
            Patient dashboard
          </Typography>
          <Typography color="text.secondary">
            Review active requests and jump into bidding rooms.
          </Typography>
        </div>

        <Button variant="contained" onClick={() => setActiveRole("patient")}>
          Use patient role
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {demoRequests.map((request) => (
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
                  <Typography variant="body2">Target budget: {request.budget}</Typography>
                  <Button component={RouterLink} to={`/requests/${request.id}`} variant="outlined">
                    Open room
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
