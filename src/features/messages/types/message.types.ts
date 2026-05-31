export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  product_id: number | null;
  message: string;
  type: 'text' | 'image' | 'audio' | 'file';
  file_path: string | null;
  is_read: boolean;
  created_at: string;
  from_user: { id: number; name: string; avatar?: string };
  to_user: { id: number; name: string };
  product?: { id: number; title: string };
  reactions?: { id: number; user_id: number; emoji: string }[];
}