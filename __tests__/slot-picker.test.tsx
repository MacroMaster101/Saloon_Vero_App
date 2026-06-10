import { render, fireEvent } from '@testing-library/react-native';
import { SlotPicker } from '@/components/booking/slot-picker';

test('renders slots and fires onSelect', () => {
  const onSelect = jest.fn();
  const { getByText } = render(<SlotPicker slots={['10:00', '11:00']} selected={null} onSelect={onSelect} />);
  fireEvent.press(getByText('10:00'));
  expect(onSelect).toHaveBeenCalledWith('10:00');
});

test('shows empty message when no slots', () => {
  const { getByText } = render(<SlotPicker slots={[]} selected={null} onSelect={() => {}} />);
  expect(getByText(/no times/i)).toBeTruthy();
});
