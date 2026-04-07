import { Center, Container, VStack } from "@chakra-ui/react";

import { SignInForm } from "#features/auth/sign-in-form.tsx";

export function SignInPage() {
  return (
    <Center height="full" padding={4} width="full">
      <Container maxWidth="sm">
        <VStack gap={8} maxWidth="sm" width="full">
          <SignInForm />
        </VStack>
      </Container>
    </Center>
  );
}
