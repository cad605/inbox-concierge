import { m } from "$paraglide/messages.js";
import { Button, CloseButton, Dialog, HStack, Portal, Stack, Steps } from "@chakra-ui/react";
import { useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";

import {
  addLabelFormStandardSchema,
  MAX_LABEL_EXAMPLES_PER_LABEL,
  type ExampleSelection,
} from "#features/settings/add-label-dialog-schema.ts";
import type { AddLabelExampleThreadRow } from "#features/settings/add-label-examples-fields.tsx";
import {
  buildAddLabelWizardSteps,
  type AddLabelWizardStep,
} from "#features/settings/add-label-wizard-steps.tsx";
import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { labelCollection } from "#infrastructure/collections/labels.ts";
import { threadCollection } from "#infrastructure/collections/threads.ts";
import type { AuthUser } from "#infrastructure/hooks/use-auth.ts";
import { useAppForm } from "#ui/form.tsx";
import { toaster } from "#ui/toaster.tsx";

export function AddLabelDialog(props: { readonly user: AuthUser | null }) {
  const { user } = props;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [exampleByThreadId, setExampleByThreadId] = useState<Record<string, ExampleSelection>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef(step);
  stepRef.current = step;
  const addLabelWizardStepsRef = useRef<ReadonlyArray<AddLabelWizardStep>>([]);

  const { data: threadRows, isLoading: threadsLoading } = useLiveQuery((q) =>
    q.from({ thread: threadCollection }).orderBy(({ thread }) => thread.lastMessageAt, "desc"),
  );
  const threads = threadRows ?? [];

  useEffect(() => {
    const ids = new Set(threads.map((t) => t.id));
    setExampleByThreadId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [threads]);

  const setThreadChecked = useCallback(
    (thread: Pick<AddLabelExampleThreadRow, "id" | "lastMessageId">, checked: boolean) => {
      const messageId = thread.lastMessageId;
      if (messageId === undefined || messageId === null || messageId.length === 0) {
        return;
      }
      setExampleByThreadId((prev) => {
        if (!checked) {
          const next = { ...prev };
          delete next[thread.id];
          return next;
        }
        if (
          prev[thread.id] === undefined &&
          Object.keys(prev).length >= MAX_LABEL_EXAMPLES_PER_LABEL
        ) {
          return prev;
        }
        return {
          ...prev,
          [thread.id]: { messageId },
        };
      });
    },
    [],
  );

  const form = useAppForm({
    defaultValues: {
      name: "",
      prompt: "",
    },
    validators: {
      onChange: addLabelFormStandardSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) {
        return;
      }

      const steps = addLabelWizardStepsRef.current;
      if (stepRef.current === 0) {
        if (!steps[0]?.validate({ name: value.name })) {
          toaster.create({ title: m.settings_auto_labels_wizard_step_invalid(), type: "error" });
          return;
        }
        setStep(1);
        return;
      }

      const examples = Object.values(exampleByThreadId).map((ex) => ex.messageId);

      const promptTrimmed = value.prompt.trim();
      const { data, error, response } = await api.POST("/api/labels", {
        body: {
          name: value.name.trim(),
          prompt: promptTrimmed.length > 0 ? promptTrimmed : null,
          examples: examples.length > 0 ? examples : undefined,
        },
      });

      if (!response.ok) {
        toaster.create({ title: getErrorMessage(error), type: "error" });
        return;
      }

      if (data === undefined) {
        toaster.create({ title: getErrorMessage(error), type: "error" });
        return;
      }

      await labelCollection.utils.refetch();
      setOpen(false);
      form.reset();
      setStep(0);
      setExampleByThreadId({});
    },
  });

  const nameValue = useStore(form.store, (s) => s.values.name);

  const wizardSteps = useMemo(
    () =>
      buildAddLabelWizardSteps({
        form,
        nameInputRef,
        exampleByThreadId,
        threads,
        threadsLoading,
        examplesStepActive: step === 1,
        setThreadChecked,
      }),
    // setThreadChecked is stable; include threads + form deps
    [exampleByThreadId, form, setThreadChecked, step, threads, threadsLoading],
  );

  addLabelWizardStepsRef.current = wizardSteps;

  const handleOpenChange = (e: { open: boolean }) => {
    setOpen(e.open);
    if (!e.open) {
      form.reset();
      setStep(0);
      setExampleByThreadId({});
    }
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
            <Steps.Root
              count={wizardSteps.length}
              isStepValid={(index) => wizardSteps[index]?.validate({ name: nameValue }) ?? true}
              linear
              onStepChange={(details) => {
                setStep(details.step);
              }}
              onStepInvalid={() => {
                toaster.create({
                  title: m.settings_auto_labels_wizard_step_invalid(),
                  type: "error",
                });
              }}
              step={step}
            >
              <Dialog.Header>
                <Stack gap={3}>
                  <Dialog.Title>{m.settings_auto_labels_dialog_title()}</Dialog.Title>
                  <Steps.List gap={2}>
                    {wizardSteps.map((wizardStep, index) => (
                      <Steps.Item index={index} key={index}>
                        <Steps.Trigger>
                          <Steps.Indicator />
                          <Stack gap={0} align="flex-start">
                            <Steps.Title>{wizardStep.title}</Steps.Title>
                            <Steps.Description>{wizardStep.description}</Steps.Description>
                          </Stack>
                        </Steps.Trigger>
                        <Steps.Separator />
                      </Steps.Item>
                    ))}
                  </Steps.List>
                </Stack>
              </Dialog.Header>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <Dialog.Body>
                  {wizardSteps.map((wizardStep, index) => (
                    <Steps.Content index={index} key={index}>
                      {wizardStep.render()}
                    </Steps.Content>
                  ))}
                </Dialog.Body>
                <Dialog.Footer>
                  <HStack flexWrap="wrap" gap={2} justify="flex-end" width="full">
                    <Dialog.ActionTrigger asChild>
                      <Button type="button" variant="outline">
                        {m.settings_auto_labels_dialog_cancel()}
                      </Button>
                    </Dialog.ActionTrigger>
                    {step === 1 ? (
                      <Steps.PrevTrigger asChild>
                        <Button type="button" variant="outline">
                          {m.settings_auto_labels_wizard_back()}
                        </Button>
                      </Steps.PrevTrigger>
                    ) : null}
                    <form.AppForm>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                      >
                        {([canSubmit, isSubmitting]) =>
                          step === 0 ? (
                            <Steps.NextTrigger asChild>
                              <Button type="button">{m.settings_auto_labels_wizard_next()}</Button>
                            </Steps.NextTrigger>
                          ) : (
                            <Button
                              disabled={!canSubmit}
                              loading={isSubmitting}
                              onClick={() => {
                                form.handleSubmit();
                              }}
                              type="button"
                            >
                              {isSubmitting
                                ? m.settings_auto_labels_wizard_creating()
                                : m.settings_auto_labels_dialog_create()}
                            </Button>
                          )
                        }
                      </form.Subscribe>
                    </form.AppForm>
                  </HStack>
                </Dialog.Footer>
              </form>
            </Steps.Root>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
