import { m } from "$paraglide/messages.js";
import { Alert, Card, HStack, Stack, Text } from "@chakra-ui/react";
import { getRouteApi } from "@tanstack/react-router";
import { FcGoogle } from "react-icons/fc";
import { LuInbox } from "react-icons/lu";

import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { AnimateIn } from "#ui/animate-in.tsx";
import { useAppForm } from "#ui/form.tsx";

const signInRouteApi = getRouteApi("/_public/sign-in");

const signInFormDefaults = {} as const;

function oauthCallbackErrorMessage(
  code: "oauth_state" | "access_denied" | "provider" | "inbox" | "sync" | "server",
): string {
  switch (code) {
    case "oauth_state":
      return m.features_auth_sign_in_error_oauth_state();
    case "access_denied":
      return m.features_auth_sign_in_error_access_denied();
    case "provider":
      return m.features_auth_sign_in_error_provider();
    case "inbox":
      return m.features_auth_sign_in_error_inbox();
    case "sync":
      return m.features_auth_sign_in_error_sync();
    case "server":
      return m.features_auth_sign_in_error_server();
  }
}

function formSubmitErrorText(error: unknown): string | null {
  if (error == null) {
    return null;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

export function SignInForm() {
  const { error: oauthCallbackError } = signInRouteApi.useSearch();

  const form = useAppForm({
    defaultValues: signInFormDefaults,
    validators: {
      onSubmitAsync: async () => {
        try {
          const { data, error, response } = await api.GET("/api/auth/authorize/google");

          if (!response.ok || error || !data?.redirectUrl) {
            return { form: getErrorMessage(error) };
          }

          window.location.assign(data.redirectUrl);
          return undefined;
        } catch (e) {
          return { form: getErrorMessage(e) };
        }
      },
    },
  });

  return (
    <Card.Root borderColor="border.muted" borderWidth="1px" rounded="xl" width="full">
      <Card.Header textAlign="center">
        <HStack justify="center">
          <LuInbox aria-hidden size={24} />
        </HStack>
        <Card.Title>{m.features_auth_sign_in_title({ appName: m.app_name() })}</Card.Title>
        <Text color="fg.muted" fontSize="sm">
          {m.features_auth_sign_in_subtitle()}
        </Text>
      </Card.Header>

      <Card.Body>
        <Stack gap={4}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppForm>
              <form.SubmitButton
                fontWeight="bold"
                justifyContent="center"
                size="lg"
                variant="outline"
                width="full"
              >
                <HStack gap={2}>
                  <FcGoogle aria-hidden size={20} />
                  {m.features_auth_sign_in_google_submit()}
                </HStack>
              </form.SubmitButton>
            </form.AppForm>
          </form>

          <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
            {(onSubmitError) => {
              const alertMessage =
                oauthCallbackError != null
                  ? oauthCallbackErrorMessage(oauthCallbackError)
                  : formSubmitErrorText(onSubmitError);

              return (
                <AnimateIn show={alertMessage != null}>
                  <Alert.Root status="error">
                    <Alert.Description>{alertMessage}</Alert.Description>
                  </Alert.Root>
                </AnimateIn>
              );
            }}
          </form.Subscribe>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
