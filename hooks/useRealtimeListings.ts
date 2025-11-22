import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';
import { fetchListings, mapDbListingToProduct } from '../services/db';

export const useRealtimeListings = (campusId: string | undefined, isDemo: boolean) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchListings(isDemo);
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    // Initial Fetch
    fetchInitial();

    if (isDemo || !campusId || !isSupabaseConfigured()) return;

    // Realtime Subscription
    const channel = supabase.channel(`listings-campus-${campusId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'listings',
          filter: `campus_id=eq.${campusId}` 
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full product details including seller profile
            const { data: listing } = await supabase
                .from('listings')
                .select('*')
                .eq('id', payload.new.id)
                .single();
            
            if (listing) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, name, hostel, email, phone')
                    .eq('id', listing.seller_id)
                    .single();
                
                const profileMap = profile ? { [profile.id]: profile } : {};
                const newProduct = mapDbListingToProduct(listing, profileMap);
                
                // Deduplicate: Only add if not already present to prevent race conditions
                setProducts(prev => {
                  if (prev.some(p => p.id === newProduct.id)) return prev;
                  return [newProduct, ...prev];
                });
            }
          } 
          else if (payload.eventType === 'UPDATE') {
             setProducts(prev => prev.map(p => {
                 if (p.id === payload.new.id) {
                     // Optimistic update - assume seller details haven't changed for now
                     return {
                         ...p,
                         title: payload.new.title,
                         description: payload.new.description,
                         price: Number(payload.new.price),
                         isSold: payload.new.status === 'SOLD',
                         status: payload.new.status,
                         images: payload.new.images
                     };
                 }
                 return p;
             }));
          } 
          else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campusId, isDemo, fetchInitial]);

  return { products, loading, error, refresh: fetchInitial };
};