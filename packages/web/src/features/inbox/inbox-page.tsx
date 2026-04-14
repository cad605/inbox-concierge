import { Flex, Spinner } from "@chakra-ui/react";
import { Suspense } from "react";

import { useInboxThreadListState } from "#features/inbox/hooks/use-inbox-thread-list.ts";
import {
  InboxPendingJobsErrorFallback,
  InboxPendingJobsErrorSink,
  InboxThreadsEmptyFromPending,
} from "#features/inbox/inbox-pending-suspense.tsx";
import { InboxErrorSection } from "#features/inbox/ui/inbox-error.section.tsx";
import { ThreadsListboxSkeleton } from "#features/inbox/ui/threads-listbox-skeleton.tsx";
import { ThreadsListbox } from "#features/inbox/ui/threads-listbox.tsx";
import { ErrorBoundary } from "#ui/error-boundary.tsx";

export function InboxPage() {
  const {
    pageSize,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    listReady,
    threadList,
    onRetryThreads,
  } = useInboxThreadListState();

  if (isError) {
    return <InboxErrorSection onRetry={onRetryThreads} />;
  }

  return (
    <Flex flex={1} flexDirection="column" height="full" minH={0}>
      <ErrorBoundary
        fallbackRender={({ reset }) => <InboxPendingJobsErrorFallback reset={reset} />}
      >
        <Suspense fallback={null}>
          <InboxPendingJobsErrorSink />
        </Suspense>
      </ErrorBoundary>
      {!listReady ? (
        <ThreadsListboxSkeleton rowCount={pageSize} />
      ) : threadList.length === 0 ? (
        <ErrorBoundary
          fallbackRender={({ reset }) => <InboxPendingJobsErrorFallback reset={reset} />}
        >
          <Suspense
            fallback={
              <Flex align="center" flex={1} justify="center" minH="40" width="full">
                <Spinner aria-hidden size="lg" />
              </Flex>
            }
          >
            <InboxThreadsEmptyFromPending />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <ThreadsListbox
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          threads={threadList}
        />
      )}
    </Flex>
  );
}
