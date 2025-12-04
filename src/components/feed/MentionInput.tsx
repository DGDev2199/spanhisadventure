import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface UserSuggestion {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export const MentionInput = ({ value, onChange, placeholder, rows = 4, className }: MentionInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: users } = useQuery({
    queryKey: ['users-for-mentions', suggestionQuery],
    queryFn: async () => {
      if (!suggestionQuery) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${suggestionQuery}%`)
        .limit(5);
      if (error) throw error;
      return data as UserSuggestion[];
    },
    enabled: suggestionQuery.length > 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    onChange(newValue);

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setSuggestionQuery(mentionMatch[1]);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestionQuery('');
    }
  };

  const insertMention = useCallback((user: UserSuggestion) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const mention = `@${user.full_name.replace(/\s+/g, '_')}`;
      const newValue = `${beforeMention}${mention} ${textAfterCursor}`;
      onChange(newValue);
      
      // Move cursor after mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeMention.length + mention.length + 1;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowSuggestions(false);
    setSuggestionQuery('');
  }, [value, cursorPosition, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || !users?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        break;
      case 'Enter':
        if (showSuggestions && users[selectedIndex]) {
          e.preventDefault();
          insertMention(users[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      
      {showSuggestions && users && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {users.map((user, index) => {
            const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.full_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper to parse and render content with mentions highlighted
export const renderContentWithMentions = (content: string): React.ReactNode => {
  if (!content) return null;
  
  const mentionRegex = /@([a-zA-Z_]+(?:_[a-zA-Z_]+)*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add highlighted mention
    parts.push(
      <span key={match.index} className="text-primary font-medium bg-primary/10 rounded px-1">
        {match[0]}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : content;
};

// Extract mentioned user names from content
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z_]+(?:_[a-zA-Z_]+)*)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].replace(/_/g, ' '));
  }
  
  return mentions;
};
