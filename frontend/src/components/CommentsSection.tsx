import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, CornerDownRight, Trash2 } from 'lucide-react';

interface UserInfo {
  id: string;
  username: string;
  avatar: string;
}

interface Comment {
  id: string;
  userId: string;
  animeId: string;
  episodeNumber: number;
  text: string;
  parentId: string | null;
  likes: number;
  createdAt: string;
  user: UserInfo;
  replies: Comment[];
}

interface CommentsSectionProps {
  animeId: string;
  episodeNumber: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ animeId, episodeNumber }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/comments/${animeId}/${episodeNumber}`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [animeId, episodeNumber]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/comments', {
        animeId,
        episodeNumber,
        text: newCommentText,
      });
      // Add the new comment to the roots
      setComments((prev) => [res.data.comment, ...prev]);
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/comments', {
        animeId,
        episodeNumber,
        text: replyText,
        parentId,
      });

      // Update local tree with new reply
      const insertReply = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...c.replies, res.data.comment] };
          } else if (c.replies.length > 0) {
            return { ...c, replies: insertReply(c.replies) };
          }
          return c;
        });
      };

      setComments((prev) => insertReply(prev));
      setReplyText('');
      setReplyToId(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const res = await axios.post(`/api/comments/${commentId}/like`);
      // Update local state likes
      const updateLikes = (list: Comment[]): Comment[] => {
        return list.map((c) => {
          if (c.id === commentId) {
            return { ...c, likes: res.data.likes };
          } else if (c.replies.length > 0) {
            return { ...c, replies: updateLikes(c.replies) };
          }
          return c;
        });
      };
      setComments((prev) => updateLikes(prev));
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await axios.delete(`/api/comments/${commentId}`);
      
      // Delete locally from state
      const removeComment = (list: Comment[]): Comment[] => {
        return list
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: removeComment(c.replies),
          }));
      };
      setComments((prev) => removeComment(prev));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatCommentDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // RECURSIVE COMMENT COMPONENT
  const CommentNode: React.FC<{ comment: Comment; depth: number }> = ({ comment, depth }) => {
    const isReply = depth > 0;
    const canDelete = user?.id === comment.userId || user?.role === 'ADMIN';

    return (
      <div style={{ display: 'flex', gap: '14px', position: 'relative', marginTop: '16px', marginLeft: isReply ? `${Math.min(depth * 32, 64)}px` : '0' }}>
        
        {/* Connector arrow line for replies */}
        {isReply && (
          <div style={{ position: 'absolute', top: '14px', left: '-20px', color: 'rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center' }}>
            <CornerDownRight size={14} />
          </div>
        )}

        {/* User avatar */}
        <div style={{ flexShrink: 0 }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user.username}`}
            alt={comment.user.username}
            style={{
              width: isReply ? '34px' : '44px',
              height: isReply ? '34px' : '44px',
              borderRadius: '50%',
              background: 'var(--bg-surface-elevated)',
              boxShadow: 'var(--nm-flat)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              padding: '2px'
            }}
          />
        </div>

        {/* Content body */}
        <div
          style={{
            flex: 1,
            background: 'var(--bg-surface-elevated)',
            border: 'var(--border-nm)',
            borderRadius: '16px',
            boxShadow: 'var(--nm-flat)',
            padding: '16px',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)' }}>
              {comment.user.username}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatCommentDate(comment.createdAt)}
            </span>
          </div>

          {/* Text */}
          <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {comment.text}
          </p>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
            {/* Like */}
            <button
              onClick={() => handleLike(comment.id)}
              className="nm-pill"
              style={{
                border: 'none',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: 600
              }}
            >
              <Heart size={13} className="heart-icon" />
              <span>{comment.likes}</span>
            </button>

            {/* Reply */}
            {isAuthenticated && (
              <button
                onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                className="nm-pill"
                style={{
                  border: 'none',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}
              >
                <MessageSquare size={13} />
                <span>Reply</span>
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="nm-pill"
                style={{
                  border: 'none',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '9999px'
                }}
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Inline Reply input field */}
          {replyToId === comment.id && (
            <form onSubmit={(e) => handlePostReply(e, comment.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
              <textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '65px',
                  background: 'var(--bg-surface-recessed)',
                  boxShadow: 'var(--nm-inset)',
                  border: 'var(--border-nm)',
                  color: 'var(--text-main)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  outline: 'none',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReplyToId(null)}
                  className="nm-pill"
                  style={{ padding: '6px 14px', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', borderRadius: '9999px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="nm-btn-primary"
                  style={{ padding: '6px 16px', fontSize: '11px', borderRadius: '9999px', cursor: 'pointer' }}
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="nm-card"
      style={{
        borderRadius: '24px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '10px'
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '14px' }}>
        <span className="section-indicator" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Comments ({comments.length})
        </h3>
      </div>

      {/* INPUT FORM */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
            alt="avatar"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--bg-surface-elevated)',
              boxShadow: 'var(--nm-flat)',
              border: '2px solid rgba(139,92,246,0.3)',
              padding: '2px'
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              placeholder="Join the discussion... Type your comment here."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '85px',
                background: 'var(--bg-surface-recessed)',
                boxShadow: 'var(--nm-inset)',
                border: 'var(--border-nm)',
                color: 'var(--text-main)',
                borderRadius: '14px',
                padding: '14px',
                outline: 'none',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease'
              }}
              className="comment-textarea"
            />
            <button
              type="submit"
              disabled={loading || !newCommentText.trim()}
              className="nm-btn-primary"
              style={{
                alignSelf: 'flex-end',
                padding: '8px 24px',
                fontSize: '13px',
                borderRadius: '9999px',
                cursor: 'pointer'
              }}
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            background: 'var(--bg-surface-recessed)',
            boxShadow: 'var(--nm-inset)',
            border: '1px solid rgba(255,255,255,0.03)',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}
        >
          Please <a href="/auth" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>Sign In</a> to write a comment and join the discussion.
        </div>
      )}

      {/* COMMENTS FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          comments.map((comment) => (
            <React.Fragment key={comment.id}>
              {/* Root node */}
              <CommentNode comment={comment} depth={0} />
              
              {/* Nested replies */}
              {comment.replies.map((reply) => (
                <CommentNode key={reply.id} comment={reply} depth={1} />
              ))}
            </React.Fragment>
          ))
        )}
      </div>

      <style>{`
        .comment-act-btn:hover { color: var(--color-primary) !important; }
        .comment-act-btn:hover .heart-icon { fill: var(--color-primary); }
        .comment-textarea:focus { border-color: rgba(139, 92, 246, 0.4); }
      `}</style>
    </div>
  );
};
