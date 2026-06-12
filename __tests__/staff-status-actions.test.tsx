import { fireEvent, render } from '@testing-library/react-native';
import { StaffBookingCard } from '@/components/staff/booking-card';

const booking = {
  id: 'b1', reference: 'VS-12345', starts_at: '2026-06-11T09:00:00Z', ends_at: '2026-06-11T09:40:00Z',
  status: 'confirmed', customer_name: 'Nimal Perera', customer_phone: '+94771234567', notes: '', service_id: 's1',
};

test('confirmed booking shows all three status actions and fires onSetStatus', () => {
  const onSetStatus = jest.fn();
  const { getByText } = render(
    <StaffBookingCard booking={booking} serviceName="Gents Cut & Style" onSetStatus={onSetStatus} />,
  );
  expect(getByText('Nimal Perera')).toBeTruthy();
  expect(getByText('Gents Cut & Style')).toBeTruthy();
  fireEvent.press(getByText('Complete'));
  expect(onSetStatus).toHaveBeenCalledWith('b1', 'completed');
  fireEvent.press(getByText('No-show'));
  expect(onSetStatus).toHaveBeenCalledWith('b1', 'no_show');
});

test('non-confirmed booking hides actions', () => {
  const { queryByText } = render(
    <StaffBookingCard booking={{ ...booking, status: 'completed' }} serviceName="Gents Cut & Style" onSetStatus={jest.fn()} />,
  );
  expect(queryByText('Complete')).toBeNull();
  expect(queryByText('Cancel')).toBeNull();
});
