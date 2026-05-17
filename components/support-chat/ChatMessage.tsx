'use client';

import type { SupportChatRole } from '@/lib/support-chat-api';

export type UiChatMessage = {
  id: string;
  role: SupportChatRole;
  content: string;
};

type ChatMessageProps = {
  message: UiChatMessage;
};

function BotAvatar() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#21262D] text-[#FF8C00]"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M12 3a7 7 0 0 0-7 7v2.5a2.5 2.5 0 0 0 2.5 2.5H9v3l3-2 3 2v-3h1.5a2.5 2.5 0 0 0 2.5-2.5V10a7 7 0 0 0-7-7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="11" r="1" fill="currentColor" />
        <circle cx="15" cy="11" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Single chat bubble — user on the right, assistant on the left. */
export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      data-role={message.role}
    >
      {!isUser && <BotAvatar />}
      <p
        className={`max-w-[82%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:text-sm ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-[#FF8C00] to-[#E67E00] font-medium text-[#0D1117] shadow-md shadow-[#FF8C00]/20'
            : 'rounded-2xl rounded-bl-md border border-[#30363D] bg-[#21262D] text-[#E6EDF3]'
        }`}
      >
        {message.content}
      </p>
    </div>
  );
}
