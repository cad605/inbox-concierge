import { m } from "$paraglide/messages.js";
import { Alert, Button, Spinner, Stack } from "@chakra-ui/react";
import { LuInbox } from "react-icons/lu";

import { useInbox } from "#features/inbox/context.tsx";
import { EmptyState } from "#ui/empty-state.tsx";

export function InboxPendingJobsErrorFallback(props: { readonly reset: () => void }) {
  const { reset } = props;
  const { useRefetchPendingJobs } = useInbox();
  const refetchPendingJobs = useRefetchPendingJobs();
  return (
    <Stack flexShrink={0} gap={2} paddingBottom={3} paddingInline={0} paddingTop={0}>
      <Alert.Root status="error">
        <Alert.Description>{m.pending_jobs_error()}</Alert.Description>
      </Alert.Root>
      <Button
        alignSelf="flex-start"
        size="sm"
        variant="outline"
        onClick={() => {
          refetchPendingJobs();
          reset();
        }}
      >
        {m.home_threads_retry()}
      </Button>
    </Stack>
  );
}

/**
 * Subscribes to pending-jobs via suspense so first-load errors surface to an ErrorBoundary.
 * Renders nothing when healthy.
 */
export function InboxPendingJobsErrorSink() {
  const { useInboxPendingJobsErrorSinkSubscription } = useInbox();
  useInboxPendingJobsErrorSinkSubscription();
  return null;
}

/**
 * Resolves which empty-state to show when the thread list is ready and empty (depends on pending sync counts).
 */
export function InboxThreadsEmptyFromPending() {
  const { useInboxPendingJobsRowForEmptyState } = useInbox();
  const { showInboxSetupEmpty } = useInboxPendingJobsRowForEmptyState();

  if (showInboxSetupEmpty) {
    return (
      <EmptyState
        icon={<Spinner aria-hidden size="lg" />}
        title={m.home_threads_empty_setup_title()}
        description={m.home_threads_empty_setup_description()}
      />
    );
  }

  return (
    <EmptyState
      icon={<LuInbox size={28} />}
      title={m.home_threads_empty_title()}
      description={m.home_threads_empty_description()}
    />
  );
}
