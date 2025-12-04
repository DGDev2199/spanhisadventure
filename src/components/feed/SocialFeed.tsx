import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Loader2, Image, FileText, Type, LayoutGrid } from 'lucide-react';
import { CreatePostDialog } from './CreatePostDialog';
import { PostCard } from './PostCard';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const PAGE_SIZE = 10;

type FilterType = 'all' | 'text' | 'image' | 'file';

export const SocialFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['posts', filter],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filter === 'text') {
        query = query.is('media_type', null);
      } else if (filter === 'image') {
        query = query.in('media_type', ['image', 'video']);
      } else if (filter === 'file') {
        query = query.eq('media_type', 'file');
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        
        // Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);

        // Fetch roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', authorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
        
        return postsData.map(post => ({
          ...post,
          profiles: profilesMap.get(post.author_id) || null,
          role: rolesMap.get(post.author_id) || null,
        }));
      }
      return postsData || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const posts = data?.pages.flat() || [];

  const handleFilterChange = (value: string) => {
    if (value) {
      setFilter(value as FilterType);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Muro de la Comunidad
          </CardTitle>
          <CreatePostDialog />
        </div>
        
        {/* Filters */}
        <div className="mt-4">
          <ToggleGroup type="single" value={filter} onValueChange={handleFilterChange} className="justify-start">
            <ToggleGroupItem value="all" aria-label="Mostrar todo" className="gap-1">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Todo</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="text" aria-label="Solo texto" className="gap-1">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Texto</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="image" aria-label="Imágenes y videos" className="gap-1">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="file" aria-label="Archivos" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Archivos</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-muted-foreground">
            Error al cargar las publicaciones
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay publicaciones{filter !== 'all' ? ' de este tipo' : ''} aún.</p>
            <p className="text-sm mt-2">¡Sé el primero en publicar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Ver más publicaciones'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
