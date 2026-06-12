import { fireEvent, render } from '@testing-library/react-native';
import { StaffBookingCard } from '@/components/staff/booking-card';

const booking = {
  id: 'b1', reference: 'VS-12345', starts_at: '2026-06-11T09:00:00Z', ends_at: '2026-06-11T09:40:00Z',
  status: 'completed', customer_name: 'Nimal Perera', customer_phone: '+94771234567', notes: '', service_id: 's1',
};

test('renders stylist tag when stylistName passed', () => {
  const { getByText } = render(
    <StaffBookingCard booking={booking} serviceName="Cut" stylistName="Ruwan" onSetStatus={jest.fn()} />,
  );
  expect(getByText('Ruwan')).toBeTruthy();
});

test('undo action appears only with allowUndo on finished bookings and emits confirmed', () => {
  const onSetStatus = jest.fn();
  const { getByText, queryByText, rerender } = render(
    <StaffBookingCard booking={booking} serviceName="Cut" allowUndo onSetStatus={onSetStatus} />,
  );
  fireEvent.press(getByText('Undo to confirmed'));
  expect(onSetStatus).toHaveBeenCalledWith('b1', 'confirmed');
  rerender(<StaffBookingCard booking={booking} serviceName="Cut" onSetStatus={onSetStatus} />);
  expect(queryByText('Undo to confirmed')).toBeNull();
});
