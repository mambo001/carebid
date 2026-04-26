import React from "react"
import { useState } from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material"
import { Form } from "react-final-form"
import { TextField } from "mui-rff"
import { useNavigate } from "react-router-dom"

import { signUpUser } from "../../../lib/auth"
import { useAppState } from "../../context/app-state"

type SignUpValues = {
  name: string
  email: string
  password: string
}

const required = (value: unknown) => (value ? undefined : "Required")

export function SignUpPage() {
  const navigate = useNavigate()
  const setAuthUser = useAppState((state) => state.setAuthUser)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: SignUpValues) => {
    setError(null)
    try {
      const user = await signUpUser(values.name, values.email, values.password)

      if (user) {
        setAuthUser({
          id: user.id,
          email: user.email,
          name: user.name,
        })
      }

      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed")
    }
  }

  return (
    <Stack spacing={4} alignItems="center" sx={{ pt: 8 }}>
      <Stack spacing={1} alignItems="center" sx={{ maxWidth: 400 }}>
        <Typography variant="h1">Create account</Typography>
        <Typography color="text.secondary" textAlign="center">
          Sign up to start using CareBid
        </Typography>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 4, width: "100%", maxWidth: 400 }}>
        <CardContent>
          <Form<SignUpValues>
            onSubmit={handleSubmit}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {error && <Alert severity="error">{error}</Alert>}
                  <TextField
                    name="name"
                    label="Full name"
                    required
                    fieldProps={{ validate: required }}
                  />
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    required
                    fieldProps={{ validate: required }}
                  />
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    required
                    fieldProps={{ validate: required }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                  >
                    {submitting ? "Creating account..." : "Sign up"}
                  </Button>
                  <Typography variant="body2" textAlign="center">
                    Already have an account?{" "}
                    <Link component="button" type="button" onClick={() => navigate("/sign-in")}>
                      Sign in
                    </Link>
                  </Typography>
                </Stack>
              </form>
            )}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}
