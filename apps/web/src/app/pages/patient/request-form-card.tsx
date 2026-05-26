import React from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material"
import { Form } from "react-final-form"
import { Select, TextField } from "mui-rff"

import { useCreateRequestMutation } from "../../../lib/queries"
import {
  createInitialRequestValues,
  requestCategoryOptions,
  type RequestFormValues,
} from "../../../lib/request-form"

const required = (value: unknown) => (value ? undefined : "Required")

export function PatientRequestFormCard() {
  const createRequest = useCreateRequestMutation()
  const initialValues = createInitialRequestValues()

  return (
    <Card elevation={0}>
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h2">Create request</Typography>

          <Form<RequestFormValues>
            initialValues={initialValues}
            onSubmit={async (values) => {
              await createRequest.mutateAsync({
                title: values.title,
                description: values.sanitizedSummary,
                category: values.category,
              })
            }}
            render={({ handleSubmit, submitting }) => {
              return (
                <form onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    {createRequest.isSuccess && (
                      <Alert severity="success">
                        Request created.
                      </Alert>
                    )}

                    {createRequest.isError && (
                      <Alert severity="error">Failed to create request.</Alert>
                    )}

                    <Select
                      name="category"
                      label="Category"
                      required
                      fieldProps={{ validate: required }}
                    >
                      {requestCategoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>

                    <TextField
                      name="title"
                      label="Title"
                      required
                      fieldProps={{ validate: required }}
                    />

                    <TextField
                      name="sanitizedSummary"
                      label="Description"
                      required
                      fieldProps={{ validate: required }}
                      multiline
                      minRows={3}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting || createRequest.isPending}
                    >
                      {createRequest.isPending ? "Saving..." : "Create request"}
                    </Button>
                  </Stack>
                </form>
              )
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
