import { m } from "$paraglide/messages.js";
import { Flex, Spinner } from "@chakra-ui/react";
import { useLiveInfiniteQuery, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import { LuInbox } from "react-icons/lu";

import { InboxErrorSection } from "#features/inbox/inbox-error.section.tsx";
import { ThreadsListboxSkeleton } from "#features/inbox/threads-listbox-skeleton.tsx";
import { ThreadsListbox } from "#features/inbox/threads-listbox.tsx";
import { inboxThreadsLiveQuery } from "#infrastructure/collections/inbox-threads-live-query.ts";
import { pendingJobsCollection } from "#infrastructure/collections/pending-jobs.ts";
import { queryClient } from "#infrastructure/query-client.ts";
import { threadKeys } from "#infrastructure/query-keys.ts";
import { EmptyState } from "#ui/empty-state.tsx";

const inboxRouteApi = getRouteApi("/_authenticated/");

const defaultPageSize = 25;

export function InboxPage() {
  const router = useRouter();
  const search = inboxRouteApi.useSearch();
  const pageSize = search.pageSize ?? defaultPageSize;

  const { data: pendingRows } = useLiveQuery((q) => q.from({ pending: pendingJobsCollection }));
  const pending = pendingRows?.[0];

  const {
    data: threads,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isReady,
  } = useLiveInfiniteQuery(inboxThreadsLiveQuery, { pageSize }, [pageSize]);

  const listReady = isReady && !isError;
  const showInboxSetupEmpty =
    listReady && threads.length === 0 && pending !== undefined && pending.userInboxSyncCount > 0;

  if (isError) {
    return (
      <InboxErrorSection
        onRetry={() => {
          queryClient.invalidateQueries({ queryKey: threadKeys.all });
          router.invalidate();
        }}
      />
    );
  }

  return (
    <Flex flex={1} flexDirection="column" height="full" minH={0}>
      {!listReady ? (
        <ThreadsListboxSkeleton rowCount={pageSize} />
      ) : threads.length === 0 ? (
        showInboxSetupEmpty ? (
          <EmptyState
            icon={<Spinner aria-hidden size="lg" />}
            title={m.home_threads_empty_setup_title()}
            description={m.home_threads_empty_setup_description()}
          />
        ) : (
          <EmptyState
            icon={<LuInbox size={28} />}
            title={m.home_threads_empty_title()}
            description={m.home_threads_empty_description()}
          />
        )
      ) : (
        <ThreadsListbox
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          threads={threads}
        />
      )}
    </Flex>
  );
}
