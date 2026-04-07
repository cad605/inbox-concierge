import { m } from "$paraglide/messages.js";
import { Alert, Button, Flex, Heading, Skeleton, Stack, Table, Text } from "@chakra-ui/react";
import { useLiveQuery } from "@tanstack/react-db";
import { LuTag } from "react-icons/lu";

import { AddLabelDialog } from "#features/settings/add-label-dialog.tsx";
import { AutoLabelRow } from "#features/settings/auto-label-row.tsx";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import type { Label } from "#infrastructure/collections/labels.ts";
import { labelCollection } from "#infrastructure/collections/labels.ts";
import { useAuthUser } from "#infrastructure/hooks/use-auth.ts";
import { EmptyState } from "#ui/empty-state.tsx";
import { toaster } from "#ui/toaster.tsx";

const AUTO_LABELS_SKELETON_ROWS = 5;

function AutoLabelsTableSkeleton() {
  return (
    <Table.ScrollArea maxW="full">
      <Table.Root css={{ tableLayout: "fixed" }} size="sm" variant="line" width="full">
        <Table.ColumnGroup>
          <Table.Column htmlWidth="20%" />
          <Table.Column htmlWidth="62%" />
          <Table.Column htmlWidth="18%" />
        </Table.ColumnGroup>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader whiteSpace="nowrap">
              {m.settings_auto_labels_col_name()}
            </Table.ColumnHeader>
            <Table.ColumnHeader>{m.settings_auto_labels_col_prompt()}</Table.ColumnHeader>
            <Table.ColumnHeader
              aria-label={m.settings_auto_labels_col_actions()}
              textAlign="end"
              whiteSpace="nowrap"
            />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: AUTO_LABELS_SKELETON_ROWS }, (_, i) => (
            <Table.Row key={i}>
              <Table.Cell>
                <Skeleton height="5" />
              </Table.Cell>
              <Table.Cell>
                <Skeleton height="5" />
              </Table.Cell>
              <Table.Cell textAlign="end">
                <Skeleton height="6" marginInlineStart="auto" maxW="10" rounded="full" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export function AutoLabelsSection() {
  const user = useAuthUser();
  const {
    data: labelRows,
    isLoading,
    status,
  } = useLiveQuery((q) => q.from({ label: labelCollection }));

  const labels = labelRows ?? [];
  const totalCount = labels.length;

  const handleToggle = (label: Label, checked: boolean) => {
    const tx = labelCollection.update(label.id, (draft) => {
      draft.isActive = checked;
    });
    tx.isPersisted.promise.catch((error: unknown) => {
      toaster.create({ title: getErrorMessage(error), type: "error" });
    });
  };

  if (isLoading) {
    return (
      <Stack gap={6}>
        <Flex align="flex-start" flexWrap="wrap" gap={3} justify="space-between">
          <Stack gap={1} maxW="2xl">
            <Skeleton height="7" maxW="xs" />
            <Skeleton height="4" maxW="lg" />
          </Stack>

          <AddLabelDialog user={user} />
        </Flex>

        <AutoLabelsTableSkeleton />
      </Stack>
    );
  }

  if (status === "error") {
    return (
      <Stack gap={6}>
        <Flex align="flex-start" flexWrap="wrap" gap={3} justify="space-between">
          <Stack gap={1} maxW="2xl">
            <Heading size="md">{m.settings_auto_labels_title()}</Heading>
            <Text color="fg.muted" fontSize="sm">
              {m.settings_auto_labels_description()}
            </Text>
          </Stack>

          <AddLabelDialog user={user} />
        </Flex>
        <Stack gap={3} maxW="lg">
          <Alert.Root status="error">
            <Alert.Description>{m.labels_error()}</Alert.Description>
          </Alert.Root>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              labelCollection.utils.refetch();
            }}
          >
            {m.labels_retry()}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={6}>
      <Flex align="flex-start" flexWrap="wrap" gap={3} justify="space-between">
        <Stack gap={1} maxW="2xl">
          <Heading size="md">{m.settings_auto_labels_title()}</Heading>
          <Text color="fg.muted" fontSize="sm">
            {m.settings_auto_labels_description()}
          </Text>
        </Stack>

        <AddLabelDialog user={user} />
      </Flex>

      {totalCount === 0 ? (
        <EmptyState icon={<LuTag size={28} />} title={m.settings_auto_labels_empty()} />
      ) : (
        <Table.ScrollArea maxW="full">
          <Table.Root css={{ tableLayout: "fixed" }} size="sm" variant="line" width="full">
            <Table.ColumnGroup>
              <Table.Column htmlWidth="20%" />
              <Table.Column htmlWidth="62%" />
              <Table.Column htmlWidth="18%" />
            </Table.ColumnGroup>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader whiteSpace="nowrap">
                  {m.settings_auto_labels_col_name()}
                </Table.ColumnHeader>
                <Table.ColumnHeader>{m.settings_auto_labels_col_prompt()}</Table.ColumnHeader>
                <Table.ColumnHeader
                  aria-label={m.settings_auto_labels_col_actions()}
                  textAlign="end"
                  whiteSpace="nowrap"
                />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {labels.map((label) => (
                <AutoLabelRow key={label.id} label={label} onToggle={handleToggle} />
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Stack>
  );
}
