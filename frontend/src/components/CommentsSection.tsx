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
          <div style={{ position: 'absolute', top: '12px', left: '-20px', color: 'var(--border-color)', display: 'flex', alignItems: 'center' }}>
            <CornerDownRight size={14} />
          </div>
        )}

        {/* User avatar */}
        <div style={{ flexShrink: 0 }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user.username}`}
            alt={comment.user.username}
            style={{ width: isReply ? '32px' : '42px', height: isReply ? '32px' : '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(139,92,246,0.2)', padding: '2px' }}
          />
        </div>

        {/* Content body */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)' }}>
              {comment.user.username}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>
              {formatCommentDate(comment.createdAt)}
            </span>
          </div>

          {/* Text */}
          <p style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {comment.text}
          </p>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
            {/* Like */}
            <button onClick={() => handleLike(comment.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', transition: 'var(--transition-fast)' }} className="comment-act-btn">
              <Heart size={14} className="heart-icon" />
              <span>{comment.likes}</span>
            </button>

            {/* Reply */}
            {isAuthenticated && (
              <button onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', transition: 'var(--transition-fast)' }} className="comment-act-btn">
                <MessageSquare size={14} />
                <span>Reply</span>
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button onClick={() => handleDelete(comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginLeft: 'auto', fontSize: '12px', transition: 'var(--transition-fast)' }} className="comment-act-btn">
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Inline Reply input field */}
          {replyToId === comment.id && (
            <form onSubmit={(e) => handlePostReply(e, comment.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ width: '100%', minHeight: '60px', background: '#0e0e15', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '10px', outline: 'none', fontSize: '13px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setReplyToId(null)} style={{ padding: '6px 12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ padding: '6px 14px', background: 'var(--color-primary)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
      
      {/* HEADER */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        Comments ({comments.length})
      </h3>

      {/* INPUT FORM */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
            alt="avatar"
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(139,92,246,0.2)' }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              placeholder="Join the discussion... Type your comment here."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              style={{ width: '100%', minHeight: '80px', background: '#12121c', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', padding: '12px', outline: 'none', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', transition: 'var(--transition-smooth)' }}
              className="comment-textarea"
            />
            <button
              type="submit"
              disabled={loading || !newCommentText.trim()}
              className="btn-primary"
              style={{ alignSelf: 'flex-end', padding: '8px 20px', fontSize: '13px' }}
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please <a href="/auth" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</a> to write a comment and discuss this episode.
        </div>
      )}

      {/* COMMENTS FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dark)', fontSize: '14px' }}>
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
        .comment-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 10px rgba(139, 92, 246, 0.15); }
      `}</style>
    </div>
  );
};
