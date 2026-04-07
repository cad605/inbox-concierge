import { m } from "$paraglide/messages.js";
import { Alert, Button, Stack } from "@chakra-ui/react";

export type InboxErrorSectionProps = {
  readonly onRetry: () => void;
};

export function InboxErrorSection({ onRetry }: InboxErrorSectionProps) {
  return (
    <Stack flex={1} gap={4} padding={6}>
      <Alert.Root status="error">
        <Alert.Description>{m.home_threads_error()}</Alert.Description>
      </Alert.Root>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {m.home_threads_retry()}
      </Button>
    </Stack>
  );
}
