import { m } from "$paraglide/messages.js";
import { Flex, Switch, Table, Text } from "@chakra-ui/react";

import { labelSubline } from "#features/settings/auto-labels-helpers.ts";
import type { Label } from "#infrastructure/collections/labels.ts";

export interface AutoLabelRowProps {
  readonly label: Label;
  readonly onToggle: (label: Label, checked: boolean) => void;
}

export function AutoLabelRow(props: AutoLabelRowProps) {
  const { label, onToggle } = props;
  const previewText = labelSubline(label);

  return (
    <Table.Row>
      <Table.Cell overflow="hidden" verticalAlign="middle">
        <Text fontWeight="medium" truncate>
          {label.name}
        </Text>
      </Table.Cell>
      <Table.Cell overflow="hidden" verticalAlign="middle">
        <Text color="fg.muted" fontSize="sm" title={previewText} truncate>
          {previewText}
        </Text>
      </Table.Cell>
      <Table.Cell textAlign="end">
        <Flex align="center" justify="flex-end">
          <Switch.Root
            aria-label={m.settings_auto_labels_toggle_aria({ name: label.name })}
            checked={label.isActive}
            onCheckedChange={(e) => onToggle(label, e.checked)}
            size="sm"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}
