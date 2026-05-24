import { supabase } from '@/utils/supabase';
import PublicDjProfileClient from './PublicDjProfileClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const { data: dj } = await supabase
      .from('dj_directory')
      .select('dj_name, city, state')
      .eq('id', id)
      .single();
      
    if (dj) {
      return {
        title: `${dj.dj_name} - Best Professional DJ in ${dj.city}, ${dj.state} | DJ HAUNTER`,
        description: `Book ${dj.dj_name}, the top-rated sound system and DJ setup in ${dj.city}, ${dj.state}. View live video performances, setup specs, base pricing, and contact numbers.`,
      };
    }
  } catch (err) {
    console.error("Error generating metadata:", err);
  }
  
  return {
    title: 'DJ Setup Profile | DJ HAUNTER',
    description: 'Explore heavy sound systems and professional DJs for Visarjan, weddings, and festivals.',
  };
}

export default async function PublicDjProfile({ params }) {
  const { id } = await params;
  let initialDjData = null;
  let profileRetrievalErrorMessage = '';

  try {
    const { data, error } = await supabase
      .from('dj_directory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    initialDjData = data;
  } catch (error) {
    console.error("Critical error loading public profile on server:", error);
    profileRetrievalErrorMessage = "This DJ profile could not be found or has been removed from the network.";
  }

  return (
    <PublicDjProfileClient 
      initialDjData={initialDjData}
      profileRetrievalErrorMessage={profileRetrievalErrorMessage}
      targetDjProfileId={id}
    />
  );
}