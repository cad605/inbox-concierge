import { m } from "$paraglide/messages.js";
import { Container, Heading, Text } from "@chakra-ui/react";

export function InboxLoadingSection() {
  return (
    <Container paddingBlock={6}>
      <Heading size="lg">{m.app_name()}</Heading>
      <Text color="fg.muted" marginTop={2}>
        {m.app_description()}
      </Text>
      <Text color="fg.muted" marginTop={6}>
        {m.home_threads_loading()}
      </Text>
    </Container>
  );
}
