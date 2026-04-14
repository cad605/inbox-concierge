import { m } from "$paraglide/messages.js";
import {
  Box,
  Flex,
  HStack,
  Listbox,
  Spinner,
  Status,
  Tag,
  Text,
  createListCollection,
  visuallyHiddenStyle,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatFrom, formatThreadTime } from "#features/inbox/domain/inbox-format.ts";
import type { InboxThreadTableRow } from "#features/inbox/domain/types.ts";
import { type ListboxVisibleRange, useListboxVirtualizer } from "#lib/use-listbox-virtualizer.ts";

export type { InboxThreadTableRow } from "#features/inbox/domain/types.ts";

type ThreadCollectionItem = {
  value: string;
  label: string;
  snippet: string;
  lastMessageAt: string;
  messageCount: number;
  isUnread: boolean;
  participants: InboxThreadTableRow["participants"];
  labels: InboxThreadTableRow["labels"];
};

export type ThreadsListboxProps = {
  readonly threads: ReadonlyArray<InboxThreadTableRow>;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
};

export function ThreadsListbox({
  threads,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: ThreadsListboxProps) {
  const [value, setValue] = useState<Array<string>>([]);

  const count = threads.length;

  const loadMoreGuardsRef = useRef({
    count,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });
  loadMoreGuardsRef.current = { count, hasNextPage, isFetchingNextPage, fetchNextPage };

  const handleRangeChange = useCallback((range: ListboxVisibleRange) => {
    const g = loadMoreGuardsRef.current;
    if (!g.hasNextPage || g.isFetchingNextPage || g.count === 0) {
      return;
    }
    const triggerIndex = g.count > 5 ? g.count - 5 : g.count - 1;
    if (range.endIndex >= triggerIndex) {
      g.fetchNextPage();
    }
  }, []);

  const virtual = useListboxVirtualizer({
    count,
    estimateSize: () => 70,
    overscan: 8,
    onRangeChange: handleRangeChange,
  });

  const { virtualizer, virtualItems } = virtual;

  const collection = useMemo(
    () =>
      createListCollection<ThreadCollectionItem>({
        items: threads.map((t) => ({
          value: t.id,
          label: t.subject || "—",
          snippet: t.snippet,
          lastMessageAt: t.lastMessageAt,
          messageCount: t.messageCount,
          isUnread: t.isUnread,
          participants: t.participants,
          labels: t.labels,
        })),
      }),
    [threads],
  );

  useEffect(() => {
    const ids = new Set(threads.map((t) => t.id));
    setValue((v) => v.filter((id) => ids.has(id)));
  }, [threads]);

  return (
    <Box display="flex" flex={1} flexDirection="column" height="100%" minH={0} overflow="hidden">
      <Listbox.Root
        collection={collection}
        display="flex"
        flex={1}
        flexDirection="column"
        minH={0}
        onValueChange={(details) => {
          setValue(details.value);
        }}
        scrollToIndexFn={virtual.scrollToIndexFn}
        value={value}
      >
        <Listbox.Label css={visuallyHiddenStyle}>{m.home_threads_title()}</Listbox.Label>
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
              const fromText = formatFrom(item.participants);
              const timeText = formatThreadTime(item.lastMessageAt);
              const a11yLabel = [
                item.isUnread ? "Unread" : null,
                fromText,
                item.label,
                item.snippet || undefined,
                timeText,
              ]
                .filter(Boolean)
                .join(". ");

              return (
                <Listbox.Item
                  key={item.value}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  item={item}
                  width="full"
                  {...virtual.getItemProps({
                    virtualItem,
                    ariaSetSize: count,
                  })}
                >
                  <Box
                    overflowX="auto"
                    paddingBottom={2}
                    paddingTop={2}
                    paddingX={3}
                    transition="background-color 0.15s ease"
                    width="full"
                  >
                    <Listbox.ItemText css={visuallyHiddenStyle}>{a11yLabel}</Listbox.ItemText>
                    <Flex align="flex-start" columnGap={4} minW={0} width="full">
                      <Box flex={1} minW={0}>
                        <Flex align="center" columnGap={4} minW={0} width="full">
                          <HStack align="center" columnGap={2} flexShrink={0} minW={0}>
                            <Box
                              alignItems="center"
                              display="flex"
                              flexShrink={0}
                              height="1lh"
                              justifyContent="center"
                              width="12px"
                            >
                              {item.isUnread ? (
                                <Status.Root colorPalette="blue" size="sm">
                                  <Status.Indicator />
                                </Status.Root>
                              ) : null}
                            </Box>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              maxW="240px"
                              title={fromText}
                              truncate
                            >
                              {fromText}
                            </Text>
                          </HStack>

                          <Flex align="center" columnGap={3} flex={1} minW={0}>
                            <HStack
                              columnGap={1}
                              flexShrink={1}
                              minW={0}
                              overflow="hidden"
                              whiteSpace="nowrap"
                            >
                              {item.labels.map((l) => (
                                <Tag.Root key={l.labelId} flexShrink={0} size="sm" variant="subtle">
                                  <Tag.Label>{l.labelName}</Tag.Label>
                                </Tag.Root>
                              ))}
                            </HStack>
                            <Text
                              color="fg"
                              flex={1}
                              fontSize="sm"
                              fontWeight="normal"
                              minW={0}
                              truncate
                            >
                              {item.label}
                            </Text>
                          </Flex>
                        </Flex>

                        <HStack
                          align="flex-start"
                          columnGap={2}
                          marginTop={1}
                          minW={0}
                          width="full"
                        >
                          <Box flexShrink={0} width="12px" />
                          <Text color="fg.muted" flex={1} fontSize="sm" minW={0} truncate>
                            {item.snippet || "—"}
                          </Text>
                        </HStack>
                      </Box>

                      <Text
                        color="fg.muted"
                        flexShrink={0}
                        fontSize="xs"
                        lineHeight="1lh"
                        whiteSpace="nowrap"
                      >
                        {timeText}
                      </Text>
                    </Flex>
                  </Box>
                </Listbox.Item>
              );
            })}
          </div>
          {isFetchingNextPage ? (
            <Flex justify="center" paddingBottom={2} paddingTop={2}>
              <Spinner size="sm" />
            </Flex>
          ) : null}
        </Listbox.Content>
      </Listbox.Root>
    </Box>
  );
}
