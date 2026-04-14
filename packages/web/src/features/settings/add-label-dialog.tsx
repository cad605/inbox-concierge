import { m } from "$paraglide/messages.js";
import { Alert, Button, Dialog, Portal, Skeleton, Stack } from "@chakra-ui/react";
import { Suspense, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";

import { AddLabelDialogLoaded } from "#features/settings/add-label-dialog-loaded.tsx";
import { useSettings } from "#features/settings/context.tsx";
import type { SettingsUser } from "#features/settings/domain/types.ts";
import { ErrorBoundary } from "#ui/error-boundary.tsx";

function AddLabelDialogLoadErrorFallback(props: { readonly reset: () => void }) {
  const { reset } = props;
  const { useRefetchThreadCollection } = useSettings();
  const refetchThreads = useRefetchThreadCollection();
  return (
    <Stack gap={4} paddingBlock={4} paddingInline={6}>
      <Alert.Root status="error">
        <Alert.Description>{m.home_threads_error()}</Alert.Description>
      </Alert.Root>
      <Button
        alignSelf="flex-start"
        size="sm"
        variant="outline"
        onClick={() => {
          refetchThreads();
          reset();
        }}
      >
        {m.home_threads_retry()}
      </Button>
    </Stack>
  );
}

function AddLabelDialogSuspenseFallback() {
  return (
    <Stack gap={4} paddingBlock={4} paddingInline={6}>
      <Skeleton height="6" maxW="xs" />
      <Skeleton height="4" maxW="md" />
      <Stack gap={2}>
        <Skeleton height="10" />
        <Skeleton height="24" />
      </Stack>
    </Stack>
  );
}

export function AddLabelDialog(props: { readonly user: SettingsUser | null }) {
  const { user } = props;
  const [open, setOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (e: { open: boolean }) => {
    setOpen(e.open);
  };

  const handleRequestClose = () => {
    setOpen(false);
  };

  return (
    <Dialog.Root
      initialFocusEl={() => nameInputRef.current}
      lazyMount
      onOpenChange={handleOpenChange}
      open={open}
      size="lg"
    >
      <Dialog.Trigger asChild>
        <Button disabled={!user} size="sm">
          <LuPlus aria-hidden size={16} />
          {m.settings_auto_labels_add()}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {open && user ? (
              <ErrorBoundary
                resetKeys={[open]}
                fallbackRender={({ reset }) => <AddLabelDialogLoadErrorFallback reset={reset} />}
              >
                <Suspense fallback={<AddLabelDialogSuspenseFallback />}>
                  <AddLabelDialogLoaded
                    nameInputRef={nameInputRef}
                    onRequestClose={handleRequestClose}
                  />
                </Suspense>
              </ErrorBoundary>
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
