import { m } from "$paraglide/messages.js";
import {
  Box,
  Checkmark,
  Listbox,
  Stack,
  Text,
  createListCollection,
  useListboxItemContext,
  visuallyHiddenStyle,
} from "@chakra-ui/react";
import { useMemo } from "react";

import type { SettingsLabelWizardThreadRow } from "#features/settings/domain/types.ts";
import {
  MAX_LABEL_EXAMPLES_PER_LABEL,
  type ExampleSelection,
} from "#lib/add-label-dialog-schema.ts";
import { useListboxVirtualizer } from "#lib/use-listbox-virtualizer.ts";

/** Rows only need fields used by this step; accepts TanStack DB readonly rows. */
export type AddLabelExampleThreadRow = SettingsLabelWizardThreadRow;

type ExampleThreadCollectionItem = {
  value: string;
  label: string;
  snippet: string;
  messageId: string;
  disabled?: boolean;
};

const ListboxItemCheckmark = () => {
  const itemState = useListboxItemContext();
  return <Checkmark filled size="sm" checked={itemState.selected} disabled={itemState.disabled} />;
};

export function AddLabelExamplesFields(props: {
  readonly threads: ReadonlyArray<AddLabelExampleThreadRow>;
  readonly exampleByThreadId: Readonly<Record<string, ExampleSelection>>;
  readonly setThreadChecked: (
    thread: Pick<AddLabelExampleThreadRow, "id" | "lastMessageId">,
    checked: boolean,
  ) => void;
}) {
  const { threads, exampleByThreadId, setThreadChecked } = props;

  const count = threads.length;

  const virtual = useListboxVirtualizer({
    count,
    estimateSize: () => 76,
    overscan: 8,
  });

  const { virtualizer, virtualItems } = virtual;

  const selectedCount = Object.keys(exampleByThreadId).length;

  const collection = useMemo(
    () =>
      createListCollection<ExampleThreadCollectionItem>({
        items: threads.map((t) => {
          const messageId = t.lastMessageId ?? "";
          const usable = messageId.length > 0;
          const atCapUnselected =
            usable &&
            exampleByThreadId[t.id] === undefined &&
            selectedCount >= MAX_LABEL_EXAMPLES_PER_LABEL;
          const disabled = !usable || atCapUnselected;
          return {
            value: t.id,
            label: t.subject || "—",
            snippet: t.snippet,
            messageId,
            ...(disabled ? { disabled: true as const } : {}),
          };
        }),
      }),
    [exampleByThreadId, selectedCount, threads],
  );

  const selectedValues = useMemo(() => Object.keys(exampleByThreadId), [exampleByThreadId]);

  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Text fontWeight="medium">{m.settings_auto_labels_examples_title()}</Text>
        <Text color="fg.muted" fontSize="sm">
          {m.settings_auto_labels_examples_description()}
        </Text>
      </Stack>
      {threads.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          {m.settings_auto_labels_examples_empty()}
        </Text>
      ) : (
        <Box display="flex" flexDirection="column" maxH="280px" minH={0} overflow="hidden">
          <Listbox.Root
            collection={collection}
            display="flex"
            flexDirection="column"
            minH={0}
            onValueChange={(details) => {
              const next = new Set(details.value);
              const prev = new Set(Object.keys(exampleByThreadId));
              const all = new Set([...next, ...prev]);
              for (const id of all) {
                const inNext = next.has(id);
                const inPrev = prev.has(id);
                if (inNext === inPrev) {
                  continue;
                }
                const thread = threads.find((t) => t.id === id);
                if (thread === undefined) {
                  continue;
                }
                setThreadChecked(
                  { id: thread.id, lastMessageId: thread.lastMessageId ?? "" },
                  inNext,
                );
              }
            }}
            scrollToIndexFn={virtual.scrollToIndexFn}
            selectionMode="multiple"
            value={selectedValues}
          >
            <Listbox.Label css={visuallyHiddenStyle}>
              {m.settings_auto_labels_examples_title()}
            </Listbox.Label>
            <Listbox.Content
              ref={virtual.scrollRef}
              flex={1}
              maxH="none"
              minH={0}
              overflowY="auto"
              padding={0}
            >
              <div {...virtual.getViewportProps()}>
                {virtualItems.map((virtualItem) => {
                  const item = collection.items[virtualItem.index];

                  if (item === undefined) {
                    return null;
                  }

                  return (
                    <Listbox.Item
                      key={item.value}
                      data-index={virtualItem.index}
                      item={item}
                      ref={virtualizer.measureElement}
                      width="full"
                      {...virtual.getItemProps({
                        virtualItem,
                        ariaSetSize: count,
                      })}
                    >
                      <ListboxItemCheckmark />
                      <Box flex="1">
                        <Listbox.ItemText>{item.label}</Listbox.ItemText>
                        <Text lineClamp="2" fontSize="xs" color="fg.muted" mt="1">
                          {item.snippet}
                        </Text>
                      </Box>
                    </Listbox.Item>
                  );
                })}
              </div>
            </Listbox.Content>
          </Listbox.Root>
        </Box>
      )}
    </Stack>
  );
}
