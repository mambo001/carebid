import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import { Form } from "react-final-form"
import { TextField } from "mui-rff"

import type { BidInput } from "@carebid/shared"

import { usePlaceBidMutation, useWithdrawBidMutation } from "../../lib/queries"
import { useAppState } from "../context"

const required = (value: unknown) => (value ? undefined : "Required")

export function ProviderBidCard({ requestId }: { requestId: string }) {
  const session = useAppState((state) => state.session)
  const placeBid = usePlaceBidMutation(requestId)
  const withdrawBid = useWithdrawBidMutation(requestId)

  const providerId = session?.providerProfile?.id ?? "demo-provider"
  const providerDisplayName = session?.providerProfile?.displayName ?? "Demo Provider"

  const initialValues: BidInput = {
    requestId,
    providerId,
    providerDisplayName,
    amountCents: 1200000,
    availableDate: "2026-04-25",
    notes: "Open slot available this week.",
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h6" fontWeight={700}>
              Provider bid controls
            </Typography>
            <Typography color="text.secondary">
              Bids are serialized through the request room Durable Object.
            </Typography>
          </div>

          <Form<BidInput>
            initialValues={initialValues}
            onSubmit={(values) =>
              placeBid.mutateAsync({
                ...values,
                requestId,
                providerId,
                providerDisplayName,
              })
            }
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {placeBid.isSuccess && <Alert severity="success">Bid saved to the room.</Alert>}
                  {withdrawBid.isSuccess && <Alert severity="info">Bid withdrawn from the room.</Alert>}

                  <TextField
                    name="amountCents"
                    label="Bid amount (cents)"
                    type="number"
                    required
                    fieldProps={{ validate: required }}
                  />
                  <TextField
                    name="availableDate"
                    label="Available date"
                    type="date"
                    required
                    fieldProps={{ validate: required }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField name="notes" label="Notes" multiline minRows={2} />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={submitting || placeBid.isPending}>
                      {placeBid.isPending ? "Saving bid..." : "Place or update bid"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={withdrawBid.isPending}
                      onClick={() => withdrawBid.mutate({ requestId, providerId })}
                    >
                      {withdrawBid.isPending ? "Withdrawing..." : "Withdraw bid"}
                    </Button>
                  </Stack>
                </Stack>
              </form>
            )}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
