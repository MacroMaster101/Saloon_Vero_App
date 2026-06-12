import { fireEvent, render } from '@testing-library/react-native';
import { SegmentedControl } from '@/components/ui/segmented-control';

const options = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const;

test('renders all segments and reports selection', () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <SegmentedControl options={options as any} value="system" onChange={onChange} />,
  );
  expect(getByText('Light')).toBeTruthy();
  expect(getByText('System')).toBeTruthy();
  fireEvent.press(getByText('Dark'));
  expect(onChange).toHaveBeenCalledWith('dark');
});

test('fires onChange even when pressing the selected segment', () => {
  const onChange = jest.fn();
  const { getByText } = render(
    <SegmentedControl options={options as any} value="system" onChange={onChange} />,
  );
  fireEvent.press(getByText('System'));
  expect(onChange).toHaveBeenCalledWith('system');
});
