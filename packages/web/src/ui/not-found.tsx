import { m } from "$paraglide/messages.js";
import { Container, Heading, Text } from "@chakra-ui/react";

import { Link } from "#ui/link.tsx";

export function NotFound() {
  return (
    <Container paddingBlock={8}>
      <Heading size="xl">{m.not_found_title()}</Heading>

      <Text marginTop={4}>
        <Link search={{}} to="/">
          {m.not_found_back_home()}
        </Link>
      </Text>
    </Container>
  );
}
