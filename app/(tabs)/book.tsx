import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getBookableServices } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { ScreenContainer } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import type { Service } from '@/types/database';

export default function Book() {
  const { user, loading } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => { getBookableServices().then(setServices); }, []);
  useEffect(() => { if (!loading && !user) router.replace('/(auth)/login'); }, [loading, user]);
  if (loading || !user) {
    return <LoadingScreen message="Verifying access..." />;
  }
  return (
    <ScreenContainer>
      <SectionHeader eyebrow="Appointments" title="Book a service" />
      {services.map((s) => <ServiceCard key={s.id} service={s} onPress={() => router.push(`/booking/${s.id}`)} />)}
    </ScreenContainer>
  );
}
