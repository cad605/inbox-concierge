/** Feature-local thread row shapes (aligns with API / collection; no infra imports in ui/domain). */

export type InboxParticipantName =
  | { readonly _tag: "Some"; readonly value: string }
  | { readonly _tag: "None" };

export type InboxThreadParticipant = {
  readonly name: InboxParticipantName;
  readonly email: string;
};

export type InboxThreadLabel = {
  readonly labelId: string;
  readonly labelName: string;
};

export type InboxThreadTableRow = {
  readonly id: string;
  readonly subject: string;
  readonly snippet: string;
  readonly lastMessageAt: string;
  readonly messageCount: number;
  readonly isUnread: boolean;
  readonly participants: ReadonlyArray<InboxThreadParticipant>;
  readonly labels: ReadonlyArray<InboxThreadLabel>;
};
