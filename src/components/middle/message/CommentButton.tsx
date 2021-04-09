import React, { FC, memo, useCallback } from '../../../lib/teact/teact';
import { withGlobal } from '../../../lib/teact/teactn';

import {
  ApiChat, ApiMessage, ApiThreadInfo, ApiUser,
} from '../../../api/types';
import { GlobalActions } from '../../../global/types';

import { pick } from '../../../util/iteratees';
import { isChatPrivate } from '../../../modules/helpers';
import { formatInteger, formatIntegerCompact } from '../../../util/textFormat';
import buildClassName from '../../../util/buildClassName';
import { selectThreadInfo } from '../../../modules/selectors';

import Avatar from '../../common/Avatar';

import './CommentButton.scss';

type OwnProps = {
  message: ApiMessage;
  disabled?: boolean;
};

type StateProps = {
  threadInfo: ApiThreadInfo;
  usersById?: Record<number, ApiUser>;
  chatsById?: Record<number, ApiChat>;
};

type DispatchProps = Pick<GlobalActions, 'openChat'>;

const CommentButton: FC<OwnProps & StateProps & DispatchProps> = ({
  disabled, threadInfo, usersById, chatsById, openChat,
}) => {
  const {
    threadId, chatId, messagesCount, lastMessageId, lastReadInboxMessageId, recentReplierIds,
  } = threadInfo;

  const handleClick = useCallback(() => {
    openChat({ id: chatId, threadId });
  }, [openChat, chatId, threadId]);

  if (messagesCount === undefined) {
    return undefined;
  }

  const recentRepliers = recentReplierIds && recentReplierIds.map((peerId) => {
    return isChatPrivate(peerId) ? usersById![peerId] : chatsById![peerId];
  }).filter(Boolean);

  function renderRecentRepliers() {
    return (
      recentRepliers && recentRepliers.length > 0 && (
        <div className="recent-repliers">
          {recentRepliers.map((user) => (
            <Avatar
              key={user.id}
              size="small"
              user={isChatPrivate(user.id) ? user as ApiUser : undefined}
              chat={!isChatPrivate(user.id) ? user as ApiChat : undefined}
            />
          ))}
        </div>
      )
    );
  }

  const hasUnread = Boolean(lastReadInboxMessageId && lastMessageId && lastReadInboxMessageId < lastMessageId);

  return (
    <div
      data-cnt={formatIntegerCompact(messagesCount)}
      className={buildClassName('CommentButton', hasUnread && 'has-unread', disabled && 'disabled')}
      onClick={handleClick}
    >
      <i className="icon-comments-sticker" />
      {(!recentRepliers || recentRepliers.length === 0) && <i className="icon-comments" />}
      {renderRecentRepliers()}
      <div className="label">{renderLabel(messagesCount)}</div>
      <i className="icon-next" />
    </div>
  );
};

function renderLabel(messagesCount: number) {
  if (messagesCount === 0) {
    return 'Leave a Comment';
  }

  if (messagesCount === 1) {
    return '1 Comment';
  }

  return `${formatInteger(messagesCount)} Comments`;
}

export default memo(withGlobal<OwnProps>(
  (global, { message }) => {
    const { threadId, chatId } = message.threadInfo!;

    const threadInfo = selectThreadInfo(global, chatId, threadId) || message.threadInfo!;
    const { byId: usersById } = global.users;
    const { byId: chatsById } = global.chats;

    return {
      threadInfo,
      usersById,
      chatsById,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, [
    'openChat',
  ]),
)(CommentButton));
