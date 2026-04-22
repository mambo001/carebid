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

import { signInUser } from "../../../lib/auth"
import { useAppState } from "../../context/app-state"

type SignInValues = {
  email: string
  password: string
}

const required = (value: unknown) => (value ? undefined : "Required")

export function SignInPage() {
  const navigate = useNavigate()
  const setNeonUser = useAppState((state) => state.setNeonUser)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: SignInValues) => {
    setError(null)
    try {
      const user = await signInUser(values.email, values.password)

      if (user) {
        setNeonUser({
          id: user.id,
          email: user.email,
          name: user.name,
        })
      }

      navigate("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
    }
  }

  return (
    <Stack spacing={4} alignItems="center" sx={{ pt: 8 }}>
      <Stack spacing={1} alignItems="center" sx={{ maxWidth: 400 }}>
        <Typography variant="h1">Sign in</Typography>
        <Typography color="text.secondary" textAlign="center">
          Enter your credentials to access CareBid
        </Typography>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 4, width: "100%", maxWidth: 400 }}>
        <CardContent>
          <Form<SignInValues>
            onSubmit={handleSubmit}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {error && <Alert severity="error">{error}</Alert>}
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
                    {submitting ? "Signing in..." : "Sign in"}
                  </Button>
                  <Typography variant="body2" textAlign="center">
                    No account?{" "}
                    <Link component="button" type="button" onClick={() => navigate("/sign-up")}>
                      Sign up
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
