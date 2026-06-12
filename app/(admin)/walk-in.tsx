import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getBookableServices } from '@/lib/api/queries';
import { ServiceCard } from '@/components/services/service-card';
import { LoadingScreen } from '@/components/ui/loading';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BackButton } from '@/components/ui/back-button';
import type { Service } from '@/types/database';

export default function WalkIn() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookableServices().then((rows) => {
      setServices(rows as Service[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingScreen message="Loading services..." />;

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="WALK-IN" title="New booking" subtitle="Pick a service to start" left={<BackButton />} />
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onPress={() => router.push(`/booking/${service.id}` as never)}
        />
      ))}
    </ScreenContainer>
  );
}
